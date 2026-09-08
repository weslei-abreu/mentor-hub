import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import * as authService from "../services/authService.js";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";

export const authRouter = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

const forgotSchema = z.object({
  email: z.string().email(),
});

const resetSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(6),
});

authRouter.use(authLimiter);

authRouter.post("/login", validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    res.json(await authService.login(email, password));
  } catch (error) {
    next(error);
  }
});

authRouter.post("/refresh", validate(refreshSchema), async (req, res, next) => {
  try {
    res.json(await authService.refresh(req.body.refreshToken));
  } catch (error) {
    next(error);
  }
});

authRouter.post("/logout", validate(refreshSchema), async (req, res, next) => {
  try {
    await authService.logout(req.body.refreshToken);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

authRouter.get("/me", requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    res.json(await authService.me(req.user!.sub));
  } catch (error) {
    next(error);
  }
});

authRouter.post("/forgot-password", validate(forgotSchema), async (req, res, next) => {
  try {
    await authService.forgotPassword(req.body.email);
    res.json({
      message: "Se o e-mail existir em nossa base, você receberá um link de redefinição.",
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/reset-password", validate(resetSchema), async (req, res, next) => {
  try {
    await authService.resetPassword(req.body.token, req.body.password);
    res.json({ message: "Senha redefinida com sucesso." });
  } catch (error) {
    next(error);
  }
});
