import { Router } from "express";
import { v4 as uuid } from "uuid";
import { z } from "zod";
import { db } from "../db/knex.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { HttpError } from "../middlewares/errorHandler.js";

export const plansRouter = Router();

function parsePlan(plan: Record<string, unknown>) {
  return {
    ...plan,
    features: typeof plan.features === "string" ? JSON.parse(plan.features) : plan.features,
  };
}

plansRouter.get("/", async (req, res, next) => {
  try {
    const onlyActive = req.query.active !== "false";
    const plans = await db("plans")
      .modify((qb) => {
        if (onlyActive) qb.where("active", true);
      })
      .orderBy("price", "asc");
    res.json(plans.map(parsePlan));
  } catch (error) {
    next(error);
  }
});

const planSchema = z.object({
  name: z.string().min(1),
  price: z.number().nonnegative(),
  period: z.string().min(1),
  monthlyEquivalent: z.number().nonnegative(),
  features: z.array(z.string()),
  highlight: z.boolean().optional(),
  active: z.boolean().optional(),
});

plansRouter.post(
  "/",
  requireAuth,
  requireRole("admin"),
  validate(planSchema),
  async (req, res, next) => {
    try {
      const id = uuid();
      const { monthlyEquivalent, ...rest } = req.body;
      await db("plans").insert({
        id,
        ...rest,
        monthly_equivalent: monthlyEquivalent,
        features: JSON.stringify(rest.features),
      });
      const plan = await db("plans").where({ id }).first();
      res.status(201).json(parsePlan(plan));
    } catch (error) {
      next(error);
    }
  },
);

plansRouter.patch(
  "/:id",
  requireAuth,
  requireRole("admin"),
  validate(planSchema.partial()),
  async (req, res, next) => {
    try {
      const { monthlyEquivalent, features, ...rest } = req.body;
      const payload: Record<string, unknown> = { ...rest };
      if (monthlyEquivalent !== undefined) payload.monthly_equivalent = monthlyEquivalent;
      if (features !== undefined) payload.features = JSON.stringify(features);

      const updated = await db("plans").where({ id: req.params.id }).update(payload);
      if (!updated) throw new HttpError(404, "Plano não encontrado.");
      const plan = await db("plans").where({ id: req.params.id }).first();
      res.json(parsePlan(plan));
    } catch (error) {
      next(error);
    }
  },
);
