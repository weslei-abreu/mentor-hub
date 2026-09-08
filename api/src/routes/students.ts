import { Router } from "express";
import { z } from "zod";
import { db } from "../db/knex.js";
import { requireAuth, requireRole, type AuthenticatedRequest } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { HttpError } from "../middlewares/errorHandler.js";
import { parsePagination, paginationMeta } from "../utils/pagination.js";
import * as studentService from "../services/studentService.js";

export const studentsRouter = Router();

studentsRouter.get("/me/progress", requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const [byTag, watched] = await Promise.all([
      studentService.progressByTag(req.user!.sub),
      studentService.watchedHistory(req.user!.sub),
    ]);
    res.json({ progressByTag: byTag, watched });
  } catch (error) {
    next(error);
  }
});

studentsRouter.use(requireAuth, requireRole("admin", "mentor"));

const listSchema = z.object({
  status: z.enum(["ativo", "inativo"]).optional(),
  q: z.string().optional(),
  createdFrom: z.string().optional(),
  createdTo: z.string().optional(),
  lastAccessFrom: z.string().optional(),
  lastAccessTo: z.string().optional(),
  sort: z.enum(["tempo_assistido"]).optional(),
  page: z.coerce.number().optional(),
  perPage: z.coerce.number().optional(),
});

studentsRouter.get("/", validate(listSchema, "query"), async (req, res, next) => {
  try {
    const { status, q, createdFrom, createdTo, lastAccessFrom, lastAccessTo, sort } =
      req.query as z.infer<typeof listSchema>;
    const pagination = parsePagination(req.query as Record<string, unknown>);

    const rows = await db("users")
      .where({ role: "aluno" })
      .modify((qb) => {
        if (q)
          qb.where((qb2) => qb2.whereILike("name", `%${q}%`).orWhereILike("business", `%${q}%`));
        if (createdFrom) qb.where("created_at", ">=", createdFrom);
        if (createdTo) qb.where("created_at", "<=", createdTo);
        if (lastAccessFrom) qb.where("last_access", ">=", lastAccessFrom);
        if (lastAccessTo) qb.where("last_access", "<=", lastAccessTo);
      })
      .select("id", "name", "email", "avatar", "business", "created_at", "last_access");

    let students = await Promise.all(
      rows.map(async (s: (typeof rows)[number]) => ({
        ...s,
        active: studentService.isActive(s.last_access),
        minutesWatched: await studentService.minutesWatchedOf(s.id),
        completion: await studentService.completionOf(s.id),
      })),
    );

    if (status) {
      students = students.filter((s) => (status === "ativo" ? s.active : !s.active));
    }
    if (sort === "tempo_assistido") {
      students = students.sort((a, b) => b.minutesWatched - a.minutesWatched);
    }

    const total = students.length;
    const page = students.slice(
      (pagination.page - 1) * pagination.perPage,
      pagination.page * pagination.perPage,
    );

    res.json({ data: page, meta: paginationMeta(total, pagination) });
  } catch (error) {
    next(error);
  }
});

studentsRouter.get("/:id", async (req, res, next) => {
  try {
    const student = await db("users")
      .where({ id: req.params.id, role: "aluno" })
      .select("id", "name", "email", "avatar", "business", "created_at", "last_access")
      .first();
    if (!student) throw new HttpError(404, "Aluno não encontrado.");

    const [completion, minutesWatched, byTag, interests, watched] = await Promise.all([
      studentService.completionOf(student.id),
      studentService.minutesWatchedOf(student.id),
      studentService.progressByTag(student.id),
      studentService.tagInterest(student.id),
      studentService.watchedHistory(student.id),
    ]);

    res.json({
      ...student,
      active: studentService.isActive(student.last_access),
      completion,
      minutesWatched,
      progressByTag: byTag,
      tagInterest: interests,
      watched,
    });
  } catch (error) {
    next(error);
  }
});
