import type { NextFunction, Response } from "express";
import { db } from "../db/knex.js";
import type { AuthenticatedRequest } from "./auth.js";
import type { Capability, Module } from "../utils/modules.js";

// admin e mentor têm acesso total a todos os módulos e nunca passam pela
// checagem de staff_permissions — só usuários com role "staff" são
// restringidos, e por capacidade específica (basta ter UMA das capacidades
// listadas para passar).
export function checkModuleAccess(module: Module, ...anyOf: Capability[]) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ message: "Não autenticado." });
    if (req.user.role === "admin" || req.user.role === "mentor") return next();
    if (req.user.role !== "staff") {
      return res.status(403).json({ message: "Sem permissão para acessar este recurso." });
    }

    try {
      const permission = await db("staff_permissions")
        .where({ user_id: req.user.sub, module })
        .first();

      const allowed = permission ? anyOf.some((cap) => Boolean(permission[`can_${cap}`])) : false;

      if (!allowed) {
        return res.status(403).json({ message: "Sem permissão para acessar este módulo." });
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}
