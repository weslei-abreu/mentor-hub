import { Router } from "express";
import { db } from "../db/knex.js";
import { HttpError } from "../middlewares/errorHandler.js";

export const companiesRouter = Router();

companiesRouter.get("/", async (_req, res, next) => {
  try {
    res.json(await db("companies").orderBy("name", "asc"));
  } catch (error) {
    next(error);
  }
});

companiesRouter.get("/:id", async (req, res, next) => {
  try {
    const company = await db("companies").where({ id: req.params.id }).first();
    if (!company) throw new HttpError(404, "Empresa não encontrada.");
    const videos = await db("videos")
      .where({ company_id: company.id })
      .orderBy("published_at", "desc");
    res.json({ ...company, videos });
  } catch (error) {
    next(error);
  }
});
