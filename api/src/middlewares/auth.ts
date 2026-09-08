import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken, type AccessTokenPayload } from "../utils/jwt.js";

export interface AuthenticatedRequest extends Request {
  user?: AccessTokenPayload;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Não autenticado." });
  }
  try {
    req.user = verifyAccessToken(header.slice("Bearer ".length));
    next();
  } catch {
    return res.status(401).json({ message: "Token inválido ou expirado." });
  }
}

export function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    try {
      req.user = verifyAccessToken(header.slice("Bearer ".length));
    } catch {
      /* ignora token inválido em rota pública */
    }
  }
  next();
}

export function requireRole(...roles: Array<"admin" | "mentor" | "aluno" | "staff">) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Sem permissão para acessar este recurso." });
    }
    next();
  };
}
