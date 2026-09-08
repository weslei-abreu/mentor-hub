import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny } from "zod";

type Target = "body" | "query" | "params";

export function validate(schema: ZodTypeAny, target: Target = "body") {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      return res.status(422).json({ message: "Dados inválidos.", errors: result.error.flatten() });
    }
    req[target] = result.data;
    next();
  };
}
