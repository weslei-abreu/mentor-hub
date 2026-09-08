import { Router } from "express";
import { v4 as uuid } from "uuid";
import { z } from "zod";
import { db } from "../db/knex.js";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";

export const feedbacksRouter = Router();

feedbacksRouter.use(requireAuth);

feedbacksRouter.get("/", async (req, res, next) => {
  try {
    const { videoId } = req.query as { videoId?: string };
    const feedbacks = await db("feedbacks")
      .join("users", "users.id", "feedbacks.user_id")
      .modify((qb) => {
        if (videoId) qb.where("feedbacks.video_id", videoId);
      })
      .select("feedbacks.*", "users.name as user_name")
      .orderBy("feedbacks.created_at", "desc");
    res.json(feedbacks);
  } catch (error) {
    next(error);
  }
});

const createSchema = z.object({
  videoId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});

feedbacksRouter.post("/", validate(createSchema), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { videoId, rating, comment } = req.body;
    const id = uuid();
    await db("feedbacks").insert({
      id,
      video_id: videoId,
      user_id: req.user!.sub,
      rating,
      comment: comment ?? null,
    });

    const agg = await db("feedbacks")
      .where({ video_id: videoId })
      .avg("rating as avg")
      .count("id as count")
      .first();
    await db("videos")
      .where({ id: videoId })
      .update({ rating: Number(agg?.avg ?? 0).toFixed(1), ratings_count: Number(agg?.count ?? 0) });

    const feedback = await db("feedbacks")
      .join("users", "users.id", "feedbacks.user_id")
      .select("feedbacks.*", "users.name as user_name")
      .where("feedbacks.id", id)
      .first();
    res.status(201).json(feedback);
  } catch (error) {
    next(error);
  }
});
