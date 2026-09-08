import path from "node:path";
import { Router } from "express";
import multer from "multer";
import { v4 as uuid } from "uuid";
import { z } from "zod";
import { db } from "../db/knex.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { checkModuleAccess } from "../middlewares/moduleAccess.js";
import { validate } from "../middlewares/validate.js";
import { HttpError } from "../middlewares/errorHandler.js";

export const lpRouter = Router();

const uploadsDir = path.join(process.cwd(), process.env.UPLOADS_DIR ?? "uploads");

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => cb(null, `${uuid()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

function parseContent(row: Record<string, unknown>) {
  return {
    ...row,
    content: typeof row.content === "string" ? JSON.parse(row.content) : row.content,
  };
}

lpRouter.get("/content", async (_req, res, next) => {
  try {
    const sections = await db("lp_content").where({ active: true }).orderBy("order", "asc");
    const media = await db("lp_media").orderBy("order", "asc");
    const mediaBySection = new Map<string, unknown[]>();
    for (const m of media) {
      const list = mediaBySection.get(m.section_key) ?? [];
      list.push(m);
      mediaBySection.set(m.section_key, list);
    }
    res.json(
      sections.map((s) => ({ ...parseContent(s), media: mediaBySection.get(s.section_key) ?? [] })),
    );
  } catch (error) {
    next(error);
  }
});

lpRouter.use("/admin", requireAuth, requireRole("admin", "mentor", "staff"));

lpRouter.get("/admin/content", checkModuleAccess("lp", "view"), async (_req, res, next) => {
  try {
    const sections = await db("lp_content").orderBy("order", "asc");
    res.json(sections.map(parseContent));
  } catch (error) {
    next(error);
  }
});

const updateContentSchema = z.object({
  content: z.record(z.string(), z.any()),
  active: z.boolean().optional(),
});

lpRouter.put(
  "/admin/content/:sectionKey",
  checkModuleAccess("lp", "create", "edit"),
  validate(updateContentSchema),
  async (req, res, next) => {
    try {
      const { sectionKey } = req.params;
      const existing = await db("lp_content").where({ section_key: sectionKey }).first();
      const payload = {
        content: JSON.stringify(req.body.content),
        active: req.body.active ?? existing?.active ?? true,
      };

      if (existing) {
        await db("lp_content").where({ section_key: sectionKey }).update(payload);
      } else {
        const maxOrder = await db("lp_content").max("order as max").first();
        await db("lp_content").insert({
          id: uuid(),
          section_key: sectionKey,
          order: (maxOrder?.max ?? 0) + 1,
          ...payload,
        });
      }
      const section = await db("lp_content").where({ section_key: sectionKey }).first();
      res.json(parseContent(section));
    } catch (error) {
      next(error);
    }
  },
);

const moveSchema = z.object({
  direction: z.enum(["up", "down"]),
});

lpRouter.patch(
  "/admin/content/:sectionKey/order",
  checkModuleAccess("lp", "edit"),
  validate(moveSchema),
  async (req, res, next) => {
    try {
      const sections = await db("lp_content").orderBy("order", "asc");
      const index = sections.findIndex((s) => s.section_key === req.params.sectionKey);
      if (index === -1) throw new HttpError(404, "Seção não encontrada.");

      const swapIndex = req.body.direction === "up" ? index - 1 : index + 1;
      if (swapIndex < 0 || swapIndex >= sections.length) {
        res.json(sections.map(parseContent));
        return;
      }

      const current = sections[index]!;
      const swap = sections[swapIndex]!;
      await db.transaction(async (trx) => {
        await trx("lp_content").where({ id: current.id }).update({ order: swap.order });
        await trx("lp_content").where({ id: swap.id }).update({ order: current.order });
      });

      res.json((await db("lp_content").orderBy("order", "asc")).map(parseContent));
    } catch (error) {
      next(error);
    }
  },
);

const mediaSchema = z.object({
  sectionKey: z.enum(["hero", "beneficios", "depoimentos", "planos", "faq", "footer"]),
  alt: z.string().optional(),
});

lpRouter.post(
  "/admin/media",
  checkModuleAccess("lp", "create"),
  upload.single("file"),
  async (req, res, next) => {
    try {
      if (!req.file) throw new HttpError(422, "Arquivo obrigatório.");
      const { sectionKey, alt } = mediaSchema.parse(req.body);

      const id = uuid();
      const maxOrder = await db("lp_media")
        .where({ section_key: sectionKey })
        .max("order as max")
        .first();
      await db("lp_media").insert({
        id,
        section_key: sectionKey,
        url: `/uploads/${req.file.filename}`,
        alt: alt ?? null,
        order: (maxOrder?.max ?? 0) + 1,
      });
      res.status(201).json(await db("lp_media").where({ id }).first());
    } catch (error) {
      next(error);
    }
  },
);

lpRouter.delete("/admin/media/:id", checkModuleAccess("lp", "delete"), async (req, res, next) => {
  try {
    const deleted = await db("lp_media").where({ id: req.params.id }).del();
    if (!deleted) throw new HttpError(404, "Mídia não encontrada.");
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
