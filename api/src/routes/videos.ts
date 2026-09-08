import path from "node:path";
import { Router } from "express";
import multer from "multer";
import { v4 as uuid } from "uuid";
import { z } from "zod";
import { db } from "../db/knex.js";
import {
  optionalAuth,
  requireAuth,
  requireRole,
  type AuthenticatedRequest,
} from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { HttpError } from "../middlewares/errorHandler.js";
import { parsePagination, paginationMeta } from "../utils/pagination.js";
import {
  attachProgress,
  attachTags,
  extractYoutubeId,
  setTags,
  youtubeThumbnailUrl,
} from "../services/videoService.js";

export const videosRouter = Router();

const uploadsDir = path.join(process.cwd(), process.env.UPLOADS_DIR ?? "uploads");

const videoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.join(uploadsDir, "videos")),
  filename: (_req, file, cb) => cb(null, `${uuid()}${path.extname(file.originalname)}`),
});
const uploadVideoFile = multer({
  storage: videoStorage,
  limits: { fileSize: 300 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, file.mimetype.startsWith("video/")),
});

const thumbnailStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.join(uploadsDir, "videos")),
  filename: (_req, file, cb) => cb(null, `${uuid()}${path.extname(file.originalname)}`),
});
const uploadThumbnail = multer({
  storage: thumbnailStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, file.mimetype.startsWith("image/")),
});

const listSchema = z.object({
  q: z.string().optional(),
  tag: z.string().optional(),
  tags: z.string().optional(),
  companyId: z.string().optional(),
  publishedFrom: z.string().optional(),
  publishedTo: z.string().optional(),
  sort: z.enum(["recentes", "assistidos", "avaliados"]).optional(),
  page: z.coerce.number().optional(),
  perPage: z.coerce.number().optional(),
});

videosRouter.get(
  "/",
  optionalAuth,
  validate(listSchema, "query"),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { q, tag, tags, companyId, publishedFrom, publishedTo, sort } = req.query as z.infer<
        typeof listSchema
      >;
      const pagination = parsePagination(req.query as Record<string, unknown>);
      const tagList = tags ? tags.split(",").filter(Boolean) : tag ? [tag] : [];

      const base = db("videos").modify((qb) => {
        if (q)
          qb.where((qb2) =>
            qb2.whereILike("title", `%${q}%`).orWhereILike("description", `%${q}%`),
          );
        if (companyId) qb.where("company_id", companyId);
        if (publishedFrom) qb.where("published_at", ">=", publishedFrom);
        if (publishedTo) qb.where("published_at", "<=", publishedTo);
        if (tagList.length > 0) {
          qb.whereIn(
            "videos.id",
            db("video_tags")
              .join("tags", "tags.id", "video_tags.tag_id")
              .whereIn("tags.name", tagList)
              .select("video_tags.video_id"),
          );
        }
      });

      const [{ count }] = await base.clone().count<{ count: string }[]>("videos.id as count");

      const orderBy =
        sort === "assistidos" ? "views" : sort === "avaliados" ? "rating" : "published_at";

      let videos = await base
        .clone()
        .leftJoin("companies", "companies.id", "videos.company_id")
        .select("videos.*", "companies.name as company_name")
        .orderBy(orderBy, "desc")
        .limit(pagination.perPage)
        .offset((pagination.page - 1) * pagination.perPage);

      videos = await attachTags(videos);
      videos = await attachProgress(videos, req.user?.sub);

      res.json({ data: videos, meta: paginationMeta(Number(count), pagination) });
    } catch (error) {
      next(error);
    }
  },
);

videosRouter.get("/:id", optionalAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const video = await db("videos").where({ id: req.params.id }).first();
    if (!video) throw new HttpError(404, "Vídeo não encontrado.");

    const company = video.company_id
      ? await db("companies").where({ id: video.company_id }).first()
      : null;
    const [withTags] = await attachTags([video]);
    const [withProgress] = await attachProgress([withTags], req.user?.sub);

    const feedbacks = await db("feedbacks")
      .join("users", "users.id", "feedbacks.user_id")
      .where("feedbacks.video_id", video.id)
      .select("feedbacks.*", "users.name as user_name")
      .orderBy("feedbacks.created_at", "desc")
      .limit(4);

    const relatedIds = await db("video_tags")
      .whereIn("tag_id", db("video_tags").where({ video_id: video.id }).select("tag_id"))
      .whereNot("video_id", video.id)
      .distinct("video_id")
      .limit(3);
    const related = await db("videos").whereIn(
      "id",
      relatedIds.map((r) => r.video_id),
    );

    res.json({ ...withProgress, company, feedbacks, related: await attachTags(related) });
  } catch (error) {
    next(error);
  }
});

videosRouter.post(
  "/upload-file",
  requireAuth,
  requireRole("admin", "mentor"),
  uploadVideoFile.single("file"),
  (req, res, next) => {
    try {
      if (!req.file) throw new HttpError(422, "Arquivo de vídeo obrigatório.");
      res.status(201).json({ url: `/uploads/videos/${req.file.filename}` });
    } catch (error) {
      next(error);
    }
  },
);

videosRouter.post(
  "/upload-thumbnail",
  requireAuth,
  requireRole("admin", "mentor"),
  uploadThumbnail.single("file"),
  (req, res, next) => {
    try {
      if (!req.file) throw new HttpError(422, "Imagem de capa obrigatória.");
      res.status(201).json({ url: `/uploads/videos/${req.file.filename}` });
    } catch (error) {
      next(error);
    }
  },
);

const sourceFieldsSchema = z.discriminatedUnion("source", [
  z.object({ source: z.literal("youtube"), youtubeUrl: z.string().min(1) }),
  z.object({
    source: z.literal("upload"),
    fileUrl: z.string().min(1),
    thumbnailUrl: z.string().optional(),
  }),
]);

function resolveSourceFields(rawInput: unknown): Record<string, string | null> {
  if (rawInput === undefined) return {};
  const parsed = sourceFieldsSchema.safeParse(rawInput);
  if (!parsed.success) throw new HttpError(422, "Dados de origem do vídeo inválidos.");
  const input = parsed.data;

  if (input.source === "youtube") {
    const youtubeId = extractYoutubeId(input.youtubeUrl);
    if (!youtubeId) throw new HttpError(422, "Link do YouTube inválido.");
    return {
      source: "youtube",
      youtube_id: youtubeId,
      youtube_url: input.youtubeUrl,
      thumbnail_url: youtubeThumbnailUrl(youtubeId),
      file_url: null,
    };
  }
  return {
    source: "upload",
    file_url: input.fileUrl,
    thumbnail_url: input.thumbnailUrl ?? null,
    youtube_id: null,
    youtube_url: null,
  };
}

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  duration: z.number().int().positive(),
  companyId: z.string().optional(),
  tags: z.array(z.string()).default([]),
  source: z.enum(["youtube", "upload"]).optional(),
  youtubeUrl: z.string().optional(),
  fileUrl: z.string().optional(),
  thumbnailUrl: z.string().optional(),
});

videosRouter.post(
  "/",
  requireAuth,
  requireRole("admin", "mentor"),
  validate(createSchema),
  async (req, res, next) => {
    try {
      const { title, description, duration, companyId, tags, ...sourceInput } = req.body;
      const sourceFields = resolveSourceFields(sourceInput.source ? sourceInput : undefined);

      const id = uuid();
      await db("videos").insert({
        id,
        title,
        description: description ?? null,
        duration,
        company_id: companyId ?? null,
        published_at: new Date(),
        ...sourceFields,
      });
      await setTags(id, tags);
      const video = await db("videos").where({ id }).first();
      const [withTags] = await attachTags([video]);
      res.status(201).json(withTags);
    } catch (error) {
      next(error);
    }
  },
);

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  duration: z.number().int().positive().optional(),
  companyId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  source: z.enum(["youtube", "upload"]).optional(),
  youtubeUrl: z.string().optional(),
  fileUrl: z.string().optional(),
  thumbnailUrl: z.string().optional(),
});

videosRouter.patch(
  "/:id",
  requireAuth,
  requireRole("admin", "mentor"),
  validate(updateSchema),
  async (req, res, next) => {
    try {
      const { tags, companyId, source, youtubeUrl, fileUrl, thumbnailUrl, ...rest } = req.body;
      const payload: Record<string, unknown> = { ...rest };
      if (companyId !== undefined) payload.company_id = companyId;
      if (source) {
        Object.assign(payload, resolveSourceFields({ source, youtubeUrl, fileUrl, thumbnailUrl }));
      }

      if (Object.keys(payload).length > 0) {
        await db("videos").where({ id: req.params.id }).update(payload);
      }
      if (tags) await setTags(req.params.id, tags);

      const video = await db("videos").where({ id: req.params.id }).first();
      if (!video) throw new HttpError(404, "Vídeo não encontrado.");
      const [withTags] = await attachTags([video]);
      res.json(withTags);
    } catch (error) {
      next(error);
    }
  },
);

const progressSchema = z.object({
  progress: z.number().min(0).max(100),
});

videosRouter.patch(
  "/:id/progress",
  requireAuth,
  validate(progressSchema),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const userId = req.user!.sub;
      const videoId = req.params.id;
      const existing = await db("video_progress")
        .where({ user_id: userId, video_id: videoId })
        .first();
      const nextProgress = Math.max(existing?.progress ?? 0, Math.round(req.body.progress));

      if (existing) {
        await db("video_progress")
          .where({ id: existing.id })
          .update({ progress: nextProgress, watched_at: new Date() });
      } else {
        await db("video_progress").insert({
          id: uuid(),
          user_id: userId,
          video_id: videoId,
          progress: nextProgress,
          watched_at: new Date(),
        });
      }
      if (!existing || existing.progress < 100) {
        await db("videos")
          .where({ id: videoId })
          .increment("views", existing ? 0 : 1);
      }
      res.json({ progress: nextProgress });
    } catch (error) {
      next(error);
    }
  },
);
