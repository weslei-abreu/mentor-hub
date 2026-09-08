import { Router } from "express";
import { z } from "zod";
import { db } from "../db/knex.js";
import { requireAuth, requireRole, type AuthenticatedRequest } from "../middlewares/auth.js";
import { checkModuleAccess } from "../middlewares/moduleAccess.js";
import { validate } from "../middlewares/validate.js";
import { parsePagination, paginationMeta } from "../utils/pagination.js";
import * as financeService from "../services/financeService.js";

export const financeRouter = Router();

financeRouter.use(requireAuth);

financeRouter.get("/subscriptions/me", async (req: AuthenticatedRequest, res, next) => {
  try {
    await financeService.reconcileUserSubscription(req.user!.sub).catch(() => undefined);
    const subscription = await db("subscriptions")
      .join("plans", "plans.id", "subscriptions.plan_id")
      .where({ user_id: req.user!.sub })
      .select("subscriptions.*", "plans.name as plan_name")
      .orderBy("subscriptions.created_at", "desc")
      .first();
    res.json(subscription ?? null);
  } catch (error) {
    next(error);
  }
});

financeRouter.get("/transactions/me", async (req: AuthenticatedRequest, res, next) => {
  try {
    const transactions = await db("transactions")
      .join("plans", "plans.id", "transactions.plan_id")
      .where({ user_id: req.user!.sub })
      .select("transactions.*", "plans.name as plan_name")
      .orderBy("transactions.date", "desc");
    res.json(transactions);
  } catch (error) {
    next(error);
  }
});

const subscribeSchema = z.object({
  planId: z.string().min(1),
  card: z.object({
    holderName: z.string().min(3),
    number: z.string().min(13),
    expiryMonth: z.string().length(2),
    expiryYear: z.string().length(4),
    ccv: z.string().min(3),
  }),
  holder: z.object({
    cpfCnpj: z.string().min(11),
    postalCode: z.string().min(8),
    addressNumber: z.string().min(1),
    phone: z.string().min(10),
  }),
});

financeRouter.post(
  "/subscriptions",
  validate(subscribeSchema),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const result = await financeService.subscribe({
        userId: req.user!.sub,
        planId: req.body.planId,
        card: req.body.card,
        holder: req.body.holder,
        remoteIp: req.ip,
      });
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },
);

const changePlanSchema = z.object({
  planId: z.string().min(1),
});

financeRouter.post(
  "/subscriptions/change-plan",
  validate(changePlanSchema),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const subscription = await financeService.changePlan(req.user!.sub, req.body.planId);
      res.json(subscription);
    } catch (error) {
      next(error);
    }
  },
);

financeRouter.post("/subscriptions/cancel", async (req: AuthenticatedRequest, res, next) => {
  try {
    await financeService.cancelSubscription(req.user!.sub);
    res.json({ message: "Assinatura cancelada." });
  } catch (error) {
    next(error);
  }
});

financeRouter.post("/subscriptions/sync", async (req: AuthenticatedRequest, res, next) => {
  try {
    await financeService.reconcileUserSubscription(req.user!.sub);
    res.json({ message: "Assinatura sincronizada." });
  } catch (error) {
    next(error);
  }
});

const listTransactionsSchema = z.object({
  status: z.enum(["aprovado", "recusado", "pendente"]).optional(),
  method: z.enum(["cartao", "pix", "boleto"]).optional(),
  planId: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().optional(),
  perPage: z.coerce.number().optional(),
});

financeRouter.get(
  "/transactions",
  requireRole("admin", "mentor", "staff"),
  checkModuleAccess("financeiro", "view"),
  validate(listTransactionsSchema, "query"),
  async (req, res, next) => {
    try {
      const { status, method, planId, from, to } = req.query as z.infer<
        typeof listTransactionsSchema
      >;
      const pagination = parsePagination(req.query as Record<string, unknown>);

      const base = db("transactions")
        .join("users", "users.id", "transactions.user_id")
        .join("plans", "plans.id", "transactions.plan_id")
        .modify((qb) => {
          if (status) qb.where("transactions.status", status);
          if (method) qb.where("transactions.method", method);
          if (planId) qb.where("transactions.plan_id", planId);
          if (from) qb.where("transactions.date", ">=", from);
          if (to) qb.where("transactions.date", "<=", to);
        });

      const [{ count }] = await base.clone().count<{ count: string }[]>("transactions.id as count");
      const data = await base
        .clone()
        .select("transactions.*", "users.name as user_name", "plans.name as plan_name")
        .orderBy("transactions.date", "desc")
        .limit(pagination.perPage)
        .offset((pagination.page - 1) * pagination.perPage);

      res.json({ data, meta: paginationMeta(Number(count), pagination) });
    } catch (error) {
      next(error);
    }
  },
);

financeRouter.get(
  "/summary",
  requireRole("admin", "mentor", "staff"),
  checkModuleAccess("financeiro", "view"),
  async (_req, res, next) => {
    try {
      const subscriptions = await db("subscriptions")
        .join("plans", "plans.id", "subscriptions.plan_id")
        .join("users", "users.id", "subscriptions.user_id")
        .select("subscriptions.*", "plans.name as plan_name", "users.name as user_name");

      const activeCount = subscriptions.filter((s) => s.status === "ativo").length;
      const lateCount = subscriptions.filter((s) => s.status === "atrasado").length;
      const canceledCount = subscriptions.filter((s) => s.status === "cancelado").length;
      const mrr = subscriptions
        .filter((s) => s.status !== "cancelado")
        .reduce((acc, s) => acc + Number(s.amount), 0);

      const byPlanMap = new Map<string, { plan: string; count: number; amount: number }>();
      for (const s of subscriptions) {
        if (s.status === "cancelado") continue;
        const entry = byPlanMap.get(s.plan_name) ?? { plan: s.plan_name, count: 0, amount: 0 };
        entry.count += 1;
        entry.amount += Number(s.amount);
        byPlanMap.set(s.plan_name, entry);
      }

      const late = subscriptions.filter((s) => s.status === "atrasado");
      const recent = await db("transactions")
        .join("users", "users.id", "transactions.user_id")
        .join("plans", "plans.id", "transactions.plan_id")
        .select("transactions.*", "users.name as user_name", "plans.name as plan_name")
        .orderBy("transactions.date", "desc")
        .limit(10);

      const now = new Date();
      const revenueSeries = [];
      for (let i = 11; i >= 0; i--) {
        const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        const monthTransactions = await db("transactions")
          .where("status", "aprovado")
          .where("date", ">=", start)
          .where("date", "<", end);
        const monthSubscriptions = await db("subscriptions")
          .where("started_at", ">=", start)
          .where("started_at", "<", end);
        revenueSeries.push({
          label: start.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
          receita: monthTransactions
            .filter((t) => t.status === "aprovado")
            .reduce((acc, t) => acc + Number(t.amount), 0),
          novos: monthSubscriptions.length,
        });
      }

      res.json({
        mrr,
        activeCount,
        lateCount,
        canceledCount,
        byPlan: [...byPlanMap.values()],
        late,
        recent,
        revenueSeries,
      });
    } catch (error) {
      next(error);
    }
  },
);

financeRouter.post(
  "/subscriptions/:id/sync",
  requireRole("admin", "mentor", "staff"),
  checkModuleAccess("financeiro", "edit"),
  async (req, res, next) => {
    try {
      await financeService.reconcileSubscription(req.params.id);
      res.json({ message: "Assinatura sincronizada." });
    } catch (error) {
      next(error);
    }
  },
);
