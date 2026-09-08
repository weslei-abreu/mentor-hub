import { Router } from "express";
import { v4 as uuid } from "uuid";
import { z } from "zod";
import { db } from "../db/knex.js";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { HttpError } from "../middlewares/errorHandler.js";
import { parsePagination, paginationMeta } from "../utils/pagination.js";

export const communityRouter = Router();

communityRouter.use(requireAuth);

async function attachExtras(posts: any[], userId: string) {
  if (posts.length === 0) return posts;
  const ids = posts.map((p) => p.id);
  const comments = await db("comments")
    .join("users", "users.id", "comments.user_id")
    .whereIn("post_id", ids)
    .select("comments.*", "users.name as author_name")
    .orderBy("comments.created_at", "asc");
  const likes = await db("post_likes").whereIn("post_id", ids).where({ user_id: userId });
  const likedSet = new Set(likes.map((l) => l.post_id));

  const commentsByPost = new Map<string, any[]>();
  for (const c of comments) {
    const list = commentsByPost.get(c.post_id) ?? [];
    list.push(c);
    commentsByPost.set(c.post_id, list);
  }

  return posts.map((p) => ({
    ...p,
    comments: commentsByPost.get(p.id) ?? [],
    likedByMe: likedSet.has(p.id),
  }));
}

const listSchema = z.object({
  tag: z.string().optional(),
  unanswered: z.coerce.boolean().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().optional(),
  perPage: z.coerce.number().optional(),
});

communityRouter.get(
  "/posts",
  validate(listSchema, "query"),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { tag, unanswered, from, to } = req.query as z.infer<typeof listSchema>;
      const pagination = parsePagination(req.query as Record<string, unknown>);

      const base = db("posts")
        .join("users", "users.id", "posts.user_id")
        .leftJoin("tags", "tags.id", "posts.tag_id")
        .modify((qb) => {
          if (tag) qb.where("tags.name", tag);
          if (from) qb.where("posts.created_at", ">=", from);
          if (to) qb.where("posts.created_at", "<=", to);
          if (unanswered) {
            qb.whereNotIn("posts.id", db("comments").select("post_id"));
          }
        });

      const [{ count }] = await base.clone().count<{ count: string }[]>("posts.id as count");
      const posts = await base
        .clone()
        .select("posts.*", "users.name as author_name", "tags.name as tag_name")
        .orderBy("posts.created_at", "desc")
        .limit(pagination.perPage)
        .offset((pagination.page - 1) * pagination.perPage);

      const data = await attachExtras(posts, req.user!.sub);
      res.json({ data, meta: paginationMeta(Number(count), pagination) });
    } catch (error) {
      next(error);
    }
  },
);

const createPostSchema = z.object({
  text: z.string().min(1),
  tag: z.string().optional(),
  videoId: z.string().optional(),
});

communityRouter.post(
  "/posts",
  validate(createPostSchema),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { text, tag, videoId } = req.body;
      let tagId: string | null = null;
      if (tag) {
        const tagRow = await db("tags").where({ name: tag }).first();
        tagId = tagRow?.id ?? null;
      }
      const id = uuid();
      await db("posts").insert({
        id,
        user_id: req.user!.sub,
        text,
        tag_id: tagId,
        video_id: videoId ?? null,
      });
      const [post] = await attachExtras(
        await db("posts")
          .join("users", "users.id", "posts.user_id")
          .leftJoin("tags", "tags.id", "posts.tag_id")
          .select("posts.*", "users.name as author_name", "tags.name as tag_name")
          .where("posts.id", id),
        req.user!.sub,
      );
      res.status(201).json(post);
    } catch (error) {
      next(error);
    }
  },
);

communityRouter.post("/posts/:id/like", async (req: AuthenticatedRequest, res, next) => {
  try {
    const postId = req.params.id;
    const userId = req.user!.sub;
    const existing = await db("post_likes").where({ post_id: postId, user_id: userId }).first();

    if (existing) {
      await db("post_likes").where({ id: existing.id }).del();
      await db("posts").where({ id: postId }).decrement("likes_count", 1);
    } else {
      await db("post_likes").insert({ id: uuid(), post_id: postId, user_id: userId });
      await db("posts").where({ id: postId }).increment("likes_count", 1);
    }
    const post = await db("posts").where({ id: postId }).first();
    if (!post) throw new HttpError(404, "Post não encontrado.");
    res.json({ likesCount: post.likes_count, likedByMe: !existing });
  } catch (error) {
    next(error);
  }
});

const createCommentSchema = z.object({
  text: z.string().min(1),
});

communityRouter.post(
  "/posts/:id/comments",
  validate(createCommentSchema),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const post = await db("posts").where({ id: req.params.id }).first();
      if (!post) throw new HttpError(404, "Post não encontrado.");

      const id = uuid();
      await db("comments").insert({
        id,
        post_id: post.id,
        user_id: req.user!.sub,
        text: req.body.text,
      });
      const comment = await db("comments")
        .join("users", "users.id", "comments.user_id")
        .select("comments.*", "users.name as author_name")
        .where("comments.id", id)
        .first();
      res.status(201).json(comment);
    } catch (error) {
      next(error);
    }
  },
);
