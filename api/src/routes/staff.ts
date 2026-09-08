import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole, type AuthenticatedRequest } from "../middlewares/auth.js";
import { checkModuleAccess } from "../middlewares/moduleAccess.js";
import { validate } from "../middlewares/validate.js";
import { MODULES } from "../utils/modules.js";
import * as staffService from "../services/staffService.js";

export const staffRouter = Router();

staffRouter.use(requireAuth, requireRole("admin", "mentor", "staff"));

const grantSchema = z.object({
  view: z.boolean().optional(),
  create: z.boolean().optional(),
  edit: z.boolean().optional(),
  delete: z.boolean().optional(),
});

const permissionsSchema = z.record(z.enum(MODULES), grantSchema).optional();

staffRouter.get("/", checkModuleAccess("staff", "view"), async (_req, res, next) => {
  try {
    res.json(await staffService.listStaff());
  } catch (error) {
    next(error);
  }
});

staffRouter.get("/:id", checkModuleAccess("staff", "view"), async (req, res, next) => {
  try {
    res.json(await staffService.getStaff(req.params.id));
  } catch (error) {
    next(error);
  }
});

const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  business: z.string().optional(),
  permissions: permissionsSchema,
});

staffRouter.post(
  "/",
  checkModuleAccess("staff", "create"),
  validate(createSchema),
  async (req, res, next) => {
    try {
      res.status(201).json(await staffService.createStaff(req.body));
    } catch (error) {
      next(error);
    }
  },
);

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  business: z.string().optional(),
  status: z.enum(["ativo", "inativo"]).optional(),
});

staffRouter.put(
  "/:id",
  checkModuleAccess("staff", "edit"),
  validate(updateSchema),
  async (req, res, next) => {
    try {
      res.json(await staffService.updateStaff(req.params.id, req.body));
    } catch (error) {
      next(error);
    }
  },
);

staffRouter.delete("/:id", checkModuleAccess("staff", "delete"), async (req, res, next) => {
  try {
    await staffService.deleteStaff(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

const resetPasswordSchema = z.object({
  password: z.string().min(6),
});

staffRouter.post(
  "/:id/reset-password",
  checkModuleAccess("staff", "edit"),
  validate(resetPasswordSchema),
  async (req, res, next) => {
    try {
      await staffService.resetStaffPassword(req.params.id, req.body.password);
      res.json({ message: "Senha redefinida com sucesso." });
    } catch (error) {
      next(error);
    }
  },
);

staffRouter.get("/:id/permissions", checkModuleAccess("staff", "view"), async (req, res, next) => {
  try {
    res.json(await staffService.getPermissions(req.params.id));
  } catch (error) {
    next(error);
  }
});

const updatePermissionsSchema = z.object({
  permissions: z.record(z.enum(MODULES), grantSchema),
});

staffRouter.put(
  "/:id/permissions",
  checkModuleAccess("staff", "edit"),
  validate(updatePermissionsSchema),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      res.json(
        await staffService.updatePermissions(req.params.id, req.body.permissions, req.user!.sub),
      );
    } catch (error) {
      next(error);
    }
  },
);
