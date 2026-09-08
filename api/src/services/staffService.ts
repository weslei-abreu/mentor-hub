import { v4 as uuid } from "uuid";
import { db } from "../db/knex.js";
import { HttpError } from "../middlewares/errorHandler.js";
import { hashPassword } from "../utils/password.js";
import {
  CAPABILITIES,
  MODULES,
  noAccess,
  type Module,
  type ModulePermissions,
} from "../utils/modules.js";

const STAFF_COLUMNS = ["id", "name", "email", "business", "avatar", "status", "created_at"];

type PermissionsInput = Partial<Record<Module, Partial<ModulePermissions>>>;

interface PermissionRow {
  module: Module;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

function fullPermissionMap(rows: PermissionRow[]) {
  const map = Object.fromEntries(MODULES.map((m) => [m, noAccess()])) as Record<
    Module,
    ModulePermissions
  >;
  for (const row of rows) {
    map[row.module] = {
      view: Boolean(row.can_view),
      create: Boolean(row.can_create),
      edit: Boolean(row.can_edit),
      delete: Boolean(row.can_delete),
    };
  }
  return map;
}

async function permissionsOf(userId: string) {
  const rows = await db("staff_permissions").where({ user_id: userId });
  return fullPermissionMap(rows);
}

export async function listStaff() {
  const staff = await db("users").where({ role: "staff" }).select(STAFF_COLUMNS);
  const ids = staff.map((s) => s.id);
  const permissionRows = ids.length ? await db("staff_permissions").whereIn("user_id", ids) : [];
  const byUser = new Map<string, typeof permissionRows>();
  for (const row of permissionRows) {
    const list = byUser.get(row.user_id) ?? [];
    list.push(row);
    byUser.set(row.user_id, list);
  }
  return staff.map((s) => ({ ...s, permissions: fullPermissionMap(byUser.get(s.id) ?? []) }));
}

export async function getStaff(id: string) {
  const staff = await db("users").where({ id, role: "staff" }).select(STAFF_COLUMNS).first();
  if (!staff) throw new HttpError(404, "Membro da equipe não encontrado.");
  return { ...staff, permissions: await permissionsOf(id) };
}

export async function createStaff(input: {
  name: string;
  email: string;
  password: string;
  business?: string;
  permissions?: PermissionsInput;
}) {
  const existing = await db("users").where({ email: input.email }).first();
  if (existing) throw new HttpError(409, "Já existe um usuário com este e-mail.");

  const id = uuid();
  await db("users").insert({
    id,
    name: input.name,
    email: input.email,
    password_hash: await hashPassword(input.password),
    role: "staff",
    business: input.business ?? null,
    status: "ativo",
  });

  await db("staff_permissions").insert(
    MODULES.map((module) => {
      const grant = input.permissions?.[module];
      return {
        id: uuid(),
        user_id: id,
        module,
        can_view: grant?.view ?? false,
        can_create: grant?.create ?? false,
        can_edit: grant?.edit ?? false,
        can_delete: grant?.delete ?? false,
      };
    }),
  );

  return getStaff(id);
}

export async function updateStaff(
  id: string,
  input: { name?: string; business?: string; status?: "ativo" | "inativo" },
) {
  const existing = await db("users").where({ id, role: "staff" }).first();
  if (!existing) throw new HttpError(404, "Membro da equipe não encontrado.");

  const payload: Record<string, unknown> = {};
  if (input.name !== undefined) payload.name = input.name;
  if (input.business !== undefined) payload.business = input.business;
  if (input.status !== undefined) payload.status = input.status;
  if (Object.keys(payload).length > 0) {
    await db("users").where({ id }).update(payload);
  }
  return getStaff(id);
}

export async function deleteStaff(id: string) {
  const deleted = await db("users").where({ id, role: "staff" }).del();
  if (!deleted) throw new HttpError(404, "Membro da equipe não encontrado.");
}

export async function resetStaffPassword(id: string, password: string) {
  const existing = await db("users").where({ id, role: "staff" }).first();
  if (!existing) throw new HttpError(404, "Membro da equipe não encontrado.");

  await db("users")
    .where({ id })
    .update({ password_hash: await hashPassword(password) });
  await db("refresh_tokens").where({ user_id: id }).update({ revoked_at: new Date() });
}

export async function getPermissions(id: string) {
  const staff = await db("users").where({ id, role: "staff" }).first();
  if (!staff) throw new HttpError(404, "Membro da equipe não encontrado.");
  return permissionsOf(id);
}

// `actingUserId` é sempre exigido aqui (mesmo quando quem chama é admin) para
// impor a regra de que nenhum staff pode alterar as próprias permissões,
// mesmo tendo capacidade "edit" no módulo staff.
export async function updatePermissions(
  id: string,
  permissions: PermissionsInput,
  actingUserId: string,
) {
  if (id === actingUserId) {
    throw new HttpError(403, "Você não pode alterar suas próprias permissões.");
  }
  const staff = await db("users").where({ id, role: "staff" }).first();
  if (!staff) throw new HttpError(404, "Membro da equipe não encontrado.");

  await db.transaction(async (trx) => {
    for (const module of MODULES) {
      const grant = permissions[module];
      if (!grant) continue;
      const payload: Record<string, boolean> = {};
      for (const cap of CAPABILITIES) {
        if (grant[cap] !== undefined) payload[`can_${cap}`] = grant[cap]!;
      }
      if (Object.keys(payload).length === 0) continue;
      await trx("staff_permissions").where({ user_id: id, module }).update(payload);
    }
  });

  return getStaff(id);
}
