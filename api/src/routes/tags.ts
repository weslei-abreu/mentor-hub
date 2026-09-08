import { Router } from "express";
import { db } from "../db/knex.js";

export const tagsRouter = Router();

tagsRouter.get("/", async (_req, res, next) => {
  try {
    res.json(await db("tags").orderBy("name", "asc"));
  } catch (error) {
    next(error);
  }
});
