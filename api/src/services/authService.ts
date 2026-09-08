import { v4 as uuid } from "uuid";
import { db } from "../db/knex.js";
import { HttpError } from "../middlewares/errorHandler.js";
import { sendMail } from "../mail/index.js";
import { resetPasswordEmail } from "../mail/templates.js";
import { comparePassword, hashPassword } from "../utils/password.js";
import {
  refreshExpiryDate,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";
import { MODULES, noAccess, type Module, type ModulePermissions } from "../utils/modules.js";

interface UserRow {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: "admin" | "mentor" | "aluno" | "staff";
  business: string | null;
  avatar: string | null;
  status: "ativo" | "inativo";
}

async function staffPermissionsOf(userId: string) {
  const rows = await db("staff_permissions").where({ user_id: userId });
  const byModule = new Map(rows.map((row) => [row.module as Module, row]));

  const permissions: Record<Module, ModulePermissions> = {} as Record<Module, ModulePermissions>;
  for (const module of MODULES) {
    const row = byModule.get(module);
    permissions[module] = row
      ? {
          view: Boolean(row.can_view),
          create: Boolean(row.can_create),
          edit: Boolean(row.can_edit),
          delete: Boolean(row.can_delete),
        }
      : noAccess();
  }
  return permissions;
}

async function publicUser(user: UserRow) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    business: user.business,
    avatar: user.avatar,
    status: user.status,
    permissions: user.role === "staff" ? await staffPermissionsOf(user.id) : null,
  };
}

async function issueTokens(user: UserRow) {
  const accessToken = signAccessToken({ sub: user.id, role: user.role });
  const refreshToken = signRefreshToken({ sub: user.id });
  await db("refresh_tokens").insert({
    id: uuid(),
    user_id: user.id,
    token: refreshToken,
    expires_at: refreshExpiryDate(),
  });
  return { accessToken, refreshToken };
}

export async function login(email: string, password: string) {
  const user = await db<UserRow>("users").where({ email }).first();
  if (!user || !(await comparePassword(password, user.password_hash))) {
    throw new HttpError(401, "E-mail ou senha inválidos.");
  }
  if (user.status === "inativo") {
    throw new HttpError(403, "Usuário inativo. Entre em contato com o suporte.");
  }
  await db("users").where({ id: user.id }).update({ last_access: new Date() });
  const tokens = await issueTokens(user);
  return { ...tokens, user: await publicUser(user) };
}

// Refresh tokens são rotacionados a cada uso. Sem essa janela, duas abas do
// mesmo usuário (ou duas chamadas quase simultâneas) podem disputar o mesmo
// token: a primeira rotaciona com sucesso, a segunda chega logo depois vendo
// o token já revogado e derruba a sessão à toa. Tolerar reuso por alguns
// segundos após a revogação evita esse deslogamento espúrio sem abrir uma
// janela de reuso realmente perigosa.
const REFRESH_REUSE_GRACE_MS = 15_000;

export async function refresh(refreshToken: string) {
  let payload: { sub: string };
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new HttpError(401, "Refresh token inválido.");
  }
  const stored = await db("refresh_tokens")
    .where({ token: refreshToken, user_id: payload.sub })
    .first();
  if (!stored || new Date(stored.expires_at) < new Date()) {
    throw new HttpError(401, "Refresh token inválido ou expirado.");
  }
  if (stored.revoked_at) {
    const revokedMsAgo = Date.now() - new Date(stored.revoked_at).getTime();
    if (revokedMsAgo > REFRESH_REUSE_GRACE_MS) {
      throw new HttpError(401, "Refresh token inválido ou expirado.");
    }
  }

  const user = await db<UserRow>("users").where({ id: payload.sub }).first();
  if (!user) throw new HttpError(401, "Usuário não encontrado.");

  if (!stored.revoked_at) {
    await db("refresh_tokens").where({ id: stored.id }).update({ revoked_at: new Date() });
  }
  const tokens = await issueTokens(user);
  return { ...tokens, user: await publicUser(user) };
}

export async function logout(refreshToken: string) {
  await db("refresh_tokens").where({ token: refreshToken }).update({ revoked_at: new Date() });
}

export async function me(userId: string) {
  const user = await db<UserRow>("users").where({ id: userId }).first();
  if (!user) throw new HttpError(404, "Usuário não encontrado.");
  return publicUser(user);
}

export async function forgotPassword(email: string) {
  const user = await db<UserRow>("users").where({ email }).first();
  if (!user) return;

  const token = uuid();
  await db("password_resets").insert({
    id: uuid(),
    user_id: user.id,
    token,
    expires_at: new Date(Date.now() + 3600_000),
  });

  const link = `${process.env.FRONTEND_URL}/redefinir-senha/${token}`;
  try {
    await sendMail(
      user.email,
      "Redefinição de senha — Locus Club",
      resetPasswordEmail(user.name, link),
    );
  } catch (error) {
    console.error("Falha ao enviar e-mail de recuperação de senha:", error);
  }
}

export async function resetPassword(token: string, password: string) {
  const reset = await db("password_resets").where({ token }).whereNull("used_at").first();
  if (!reset || new Date(reset.expires_at) < new Date()) {
    throw new HttpError(400, "Token inválido ou expirado.");
  }
  const passwordHash = await hashPassword(password);
  await db("users").where({ id: reset.user_id }).update({ password_hash: passwordHash });
  await db("password_resets").where({ id: reset.id }).update({ used_at: new Date() });
  await db("refresh_tokens").where({ user_id: reset.user_id }).update({ revoked_at: new Date() });
}
