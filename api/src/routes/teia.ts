import { Router } from "express";
import { v4 as uuid } from "uuid";
import { z } from "zod";
import { db } from "../db/knex.js";
import { requireAuth, requireRole, type AuthenticatedRequest } from "../middlewares/auth.js";
import { checkModuleAccess } from "../middlewares/moduleAccess.js";
import { validate } from "../middlewares/validate.js";
import { HttpError } from "../middlewares/errorHandler.js";
import { parsePagination, paginationMeta } from "../utils/pagination.js";
import { buildFullGraph, buildGraph } from "../services/teiaService.js";

export const teiaRouter = Router();

teiaRouter.use(requireAuth);

// Admin/mentor têm papel de moderação da teia (oferecido no /mentor/teia), não
// disputam apresentações como os alunos, então enxergam telefone/e-mail de
// qualquer nó sem precisar solicitar liberação.
async function withAccessInfo(contacts: any[], userId: string, bypassGate = false) {
  if (contacts.length === 0) return contacts;
  const ids = contacts.map((c) => c.id);
  const myRequests = await db("teia_requests")
    .whereIn("contact_id", ids)
    .where({ requested_by_id: userId });
  const byContact = new Map(myRequests.map((r) => [r.contact_id, r]));

  return contacts.map((c) => {
    const isOwner = c.registered_by_id === userId;
    const myRequest = byContact.get(c.id);
    const unlocked = bypassGate || isOwner || myRequest?.status === "aprovado";
    return {
      id: c.id,
      name: c.name,
      companyName: c.company_name,
      field: c.field,
      city: c.city,
      registeredById: c.registered_by_id,
      isOwner,
      unlocked,
      myRequestStatus: myRequest?.status ?? null,
      phone: unlocked ? c.phone : null,
      email: unlocked ? c.email : null,
    };
  });
}

const listSchema = z.object({
  field: z.string().optional(),
  city: z.string().optional(),
  status: z.enum(["liberado", "bloqueado"]).optional(),
  q: z.string().optional(),
  page: z.coerce.number().optional(),
  perPage: z.coerce.number().optional(),
});

teiaRouter.get(
  "/contacts",
  validate(listSchema, "query"),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { field, city, q } = req.query as z.infer<typeof listSchema>;
      const status = (req.query as z.infer<typeof listSchema>).status;
      const pagination = parsePagination(req.query as Record<string, unknown>);

      const base = db("teia_contacts").modify((qb) => {
        if (field) qb.where("field", field);
        if (city) qb.where("city", city);
        if (q) {
          qb.where((qb2) =>
            qb2
              .whereILike("name", `%${q}%`)
              .orWhereILike("company_name", `%${q}%`)
              .orWhereILike("city", `%${q}%`),
          );
        }
      });

      const rows = await base.clone().orderBy("created_at", "desc");
      let withAccess = await withAccessInfo(rows, req.user!.sub, req.user!.role !== "aluno");

      if (status) {
        withAccess = withAccess.filter((c) => (status === "liberado" ? c.unlocked : !c.unlocked));
      }

      const total = withAccess.length;
      const data = withAccess.slice(
        (pagination.page - 1) * pagination.perPage,
        pagination.page * pagination.perPage,
      );
      res.json({ data, meta: paginationMeta(total, pagination) });
    } catch (error) {
      next(error);
    }
  },
);

const createContactSchema = z.object({
  name: z.string().min(1),
  companyName: z.string().optional(),
  field: z.string().optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
});

teiaRouter.post(
  "/contacts",
  validate(createContactSchema),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { name, companyName, field, city, phone, email } = req.body;
      const id = uuid();
      let linkedUserId: string | null = null;
      if (email) {
        const linkedUser = await db("users").where({ email }).first();
        linkedUserId = linkedUser?.id ?? null;
      }
      await db("teia_contacts").insert({
        id,
        registered_by_id: req.user!.sub,
        linked_user_id: linkedUserId,
        name,
        company_name: companyName ?? null,
        field: field ?? null,
        city: city ?? null,
        phone: phone ?? null,
        email: email || null,
      });
      const [contact] = await withAccessInfo(
        [await db("teia_contacts").where({ id }).first()],
        req.user!.sub,
      );
      res.status(201).json(contact);
    } catch (error) {
      next(error);
    }
  },
);

teiaRouter.get("/requests/mine", async (req: AuthenticatedRequest, res, next) => {
  try {
    const type = (req.query.type as string) ?? "sent";
    const userId = req.user!.sub;

    const query =
      type === "received"
        ? db("teia_requests")
            .join("teia_contacts", "teia_contacts.id", "teia_requests.contact_id")
            .join("users", "users.id", "teia_requests.requested_by_id")
            .where("teia_contacts.registered_by_id", userId)
            .select(
              "teia_requests.*",
              "teia_contacts.name as contact_name",
              "users.name as requester_name",
            )
        : db("teia_requests")
            .join("teia_contacts", "teia_contacts.id", "teia_requests.contact_id")
            .where("teia_requests.requested_by_id", userId)
            .select("teia_requests.*", "teia_contacts.name as contact_name");

    res.json(await query.orderBy("teia_requests.created_at", "desc"));
  } catch (error) {
    next(error);
  }
});

const createRequestSchema = z.object({
  contactId: z.string().min(1),
  message: z.string().optional(),
});

teiaRouter.post(
  "/requests",
  validate(createRequestSchema),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { contactId, message } = req.body;
      const contact = await db("teia_contacts").where({ id: contactId }).first();
      if (!contact) throw new HttpError(404, "Contato não encontrado.");
      if (contact.registered_by_id === req.user!.sub) {
        throw new HttpError(400, "Você já é o responsável por este contato.");
      }

      const existing = await db("teia_requests")
        .where({ contact_id: contactId, requested_by_id: req.user!.sub })
        .first();
      if (existing) throw new HttpError(409, "Você já solicitou apresentação para este contato.");

      const id = uuid();
      await db("teia_requests").insert({
        id,
        contact_id: contactId,
        requested_by_id: req.user!.sub,
        message: message ?? null,
        status: "pendente",
      });
      res.status(201).json(await db("teia_requests").where({ id }).first());
    } catch (error) {
      next(error);
    }
  },
);

const respondSchema = z.object({
  status: z.enum(["aprovado", "recusado"]),
});

teiaRouter.patch(
  "/requests/:id",
  validate(respondSchema),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const request = await db("teia_requests")
        .join("teia_contacts", "teia_contacts.id", "teia_requests.contact_id")
        .where("teia_requests.id", req.params.id)
        .select("teia_requests.*", "teia_contacts.registered_by_id")
        .first();
      if (!request) throw new HttpError(404, "Solicitação não encontrada.");
      if (request.registered_by_id !== req.user!.sub) {
        throw new HttpError(
          403,
          "Apenas o responsável pelo contato pode responder esta solicitação.",
        );
      }

      await db("teia_requests")
        .where({ id: req.params.id })
        .update({ status: req.body.status, responded_at: new Date() });
      res.json(await db("teia_requests").where({ id: req.params.id }).first());
    } catch (error) {
      next(error);
    }
  },
);

teiaRouter.get("/graph", async (req: AuthenticatedRequest, res, next) => {
  try {
    const rootId = (req.query.rootId as string) ?? req.user!.sub;
    res.json(await buildGraph(rootId));
  } catch (error) {
    next(error);
  }
});

teiaRouter.get(
  "/admin/graph",
  requireRole("admin", "mentor", "staff"),
  checkModuleAccess("teia", "view"),
  async (_req, res, next) => {
    try {
      res.json(await buildFullGraph());
    } catch (error) {
      next(error);
    }
  },
);

const adminListSchema = z.object({
  field: z.string().optional(),
  city: z.string().optional(),
  status: z.enum(["pendente", "aprovado", "recusado"]).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().optional(),
  perPage: z.coerce.number().optional(),
});

teiaRouter.get(
  "/admin/requests",
  requireRole("admin", "mentor", "staff"),
  checkModuleAccess("teia", "view"),
  validate(adminListSchema, "query"),
  async (req, res, next) => {
    try {
      const { field, city, status, from, to } = req.query as z.infer<typeof adminListSchema>;
      const pagination = parsePagination(req.query as Record<string, unknown>);

      const base = db("teia_requests")
        .join("teia_contacts", "teia_contacts.id", "teia_requests.contact_id")
        .join("users", "users.id", "teia_requests.requested_by_id")
        .modify((qb) => {
          if (field) qb.where("teia_contacts.field", field);
          if (city) qb.where("teia_contacts.city", city);
          if (status) qb.where("teia_requests.status", status);
          if (from) qb.where("teia_requests.created_at", ">=", from);
          if (to) qb.where("teia_requests.created_at", "<=", to);
        });

      const [{ count }] = await base
        .clone()
        .count<{ count: string }[]>("teia_requests.id as count");
      const data = await base
        .clone()
        .select(
          "teia_requests.*",
          "teia_contacts.name as contact_name",
          "teia_contacts.field as contact_field",
          "teia_contacts.city as contact_city",
          "users.name as requester_name",
        )
        .orderBy("teia_requests.created_at", "desc")
        .limit(pagination.perPage)
        .offset((pagination.page - 1) * pagination.perPage);

      res.json({ data, meta: paginationMeta(Number(count), pagination) });
    } catch (error) {
      next(error);
    }
  },
);
