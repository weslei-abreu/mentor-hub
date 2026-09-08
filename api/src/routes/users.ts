import { Router } from "express";
import { v4 as uuid } from "uuid";
import { z } from "zod";
import { db } from "../db/knex.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { HttpError } from "../middlewares/errorHandler.js";
import { hashPassword } from "../utils/password.js";
import { parsePagination, paginationMeta } from "../utils/pagination.js";

export const usersRouter = Router();

const USER_COLUMNS = [
  "id",
  "name",
  "email",
  "role",
  "business",
  "avatar",
  "status",
  "last_access",
  "created_at",
];

usersRouter.use(requireAuth, requireRole("admin", "mentor"));

const listSchema = z.object({
  role: z.enum(["admin", "mentor", "aluno"]).optional(),
  status: z.enum(["ativo", "inativo"]).optional(),
  q: z.string().optional(),
  createdFrom: z.string().optional(),
  createdTo: z.string().optional(),
  page: z.coerce.number().optional(),
  perPage: z.coerce.number().optional(),
});

usersRouter.get("/", validate(listSchema, "query"), async (req, res, next) => {
  try {
    const { role, status, q, createdFrom, createdTo } = req.query as z.infer<typeof listSchema>;
    const pagination = parsePagination(req.query as Record<string, unknown>);

    const base = db("users").modify((qb) => {
      if (role) qb.where("role", role);
      if (status) qb.where("status", status);
      if (q) qb.where((qb2) => qb2.whereILike("name", `%${q}%`).orWhereILike("email", `%${q}%`));
      if (createdFrom) qb.where("created_at", ">=", createdFrom);
      if (createdTo) qb.where("created_at", "<=", createdTo);
    });

    const [{ count }] = await base.clone().count<{ count: string }[]>("id as count");
    const data = await base
      .clone()
      .select(USER_COLUMNS)
      .orderBy("created_at", "desc")
      .limit(pagination.perPage)
      .offset((pagination.page - 1) * pagination.perPage);

    res.json({ data, meta: paginationMeta(Number(count), pagination) });
  } catch (error) {
    next(error);
  }
});

usersRouter.get("/:id", async (req, res, next) => {
  try {
    const user = await db("users").select(USER_COLUMNS).where({ id: req.params.id }).first();
    if (!user) throw new HttpError(404, "Usuário não encontrado.");
    res.json(user);
  } catch (error) {
    next(error);
  }
});

const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["admin", "mentor", "aluno"]),
  business: z.string().optional(),
});

usersRouter.post("/", requireRole("admin"), validate(createSchema), async (req, res, next) => {
  try {
    const { name, email, password, role, business } = req.body;
    const existing = await db("users").where({ email }).first();
    if (existing) throw new HttpError(409, "Já existe um usuário com este e-mail.");

    const id = uuid();
    await db("users").insert({
      id,
      name,
      email,
      password_hash: await hashPassword(password),
      role,
      business: business ?? null,
      status: "ativo",
    });
    const user = await db("users").select(USER_COLUMNS).where({ id }).first();
    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  business: z.string().optional(),
  role: z.enum(["admin", "mentor", "aluno"]).optional(),
  status: z.enum(["ativo", "inativo"]).optional(),
  avatar: z.string().optional(),
});

usersRouter.patch("/:id", requireRole("admin"), validate(updateSchema), async (req, res, next) => {
  try {
    const updated = await db("users").where({ id: req.params.id }).update(req.body);
    if (!updated) throw new HttpError(404, "Usuário não encontrado.");
    const user = await db("users").select(USER_COLUMNS).where({ id: req.params.id }).first();
    res.json(user);
  } catch (error) {
    next(error);
  }
});

usersRouter.delete("/:id", requireRole("admin"), async (req, res, next) => {
  try {
    const deleted = await db("users").where({ id: req.params.id }).del();
    if (!deleted) throw new HttpError(404, "Usuário não encontrado.");
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

const resetPasswordSchema = z.object({
  password: z.string().min(6),
});

usersRouter.post(
  "/:id/reset-password",
  requireRole("admin"),
  validate(resetPasswordSchema),
  async (req, res, next) => {
    try {
      const passwordHash = await hashPassword(req.body.password);
      const updated = await db("users")
        .where({ id: req.params.id })
        .update({ password_hash: passwordHash });
      if (!updated) throw new HttpError(404, "Usuário não encontrado.");
      await db("refresh_tokens")
        .where({ user_id: req.params.id })
        .update({ revoked_at: new Date() });
      res.json({ message: "Senha redefinida com sucesso." });
    } catch (error) {
      next(error);
    }
  },
);
