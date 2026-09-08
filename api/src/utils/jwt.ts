import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN ?? "15m";
const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN ?? "7d";

export interface AccessTokenPayload {
  sub: string;
  role: "admin" | "mentor" | "aluno";
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign({ ...payload, jti: randomUUID() }, ACCESS_SECRET, {
    expiresIn: ACCESS_EXPIRES_IN,
  } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, ACCESS_SECRET) as AccessTokenPayload;
}

// jti garante um token único mesmo quando duas emissões acontecem no
// mesmo segundo (mesmo `sub` e `iat`), o que colidiria com a constraint
// única de refresh_tokens.token.
export function signRefreshToken(payload: { sub: string }): string {
  return jwt.sign({ ...payload, jti: randomUUID() }, REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRES_IN,
  } as jwt.SignOptions);
}

export function verifyRefreshToken(token: string): { sub: string } {
  return jwt.verify(token, REFRESH_SECRET) as { sub: string };
}

export function refreshExpiryDate(): Date {
  const days = Number(REFRESH_EXPIRES_IN.replace("d", "")) || 7;
  return new Date(Date.now() + days * 86400000);
}
