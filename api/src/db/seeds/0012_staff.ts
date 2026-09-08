import type { Knex } from "knex";
import { v4 as uuid } from "uuid";
import { hashPassword } from "../../utils/password.js";
import { staffUserIds } from "../seedIds.js";
import { MODULES, type Module, type ModulePermissions } from "../../utils/modules.js";

const FULL_ACCESS: ModulePermissions = { view: true, create: true, edit: true, delete: true };
const VIEW_ONLY: ModulePermissions = { view: true, create: false, edit: false, delete: false };

const staffSeeds: Array<{
  id: string;
  name: string;
  email: string;
  business: string;
  permissions: Partial<Record<Module, ModulePermissions>>;
}> = [
  {
    id: staffUserIds.conteudo,
    name: "Camila Rocha",
    email: "conteudo@wecod.com.br",
    business: "Gestão de Conteúdo",
    permissions: { conteudo: FULL_ACCESS, dashboard: VIEW_ONLY, comunidade: VIEW_ONLY },
  },
  {
    id: staffUserIds.financeiro,
    name: "Rafael Nogueira",
    email: "financeiro@wecod.com.br",
    business: "Financeiro",
    permissions: { financeiro: FULL_ACCESS, dashboard: VIEW_ONLY, alunos: VIEW_ONLY },
  },
  {
    id: staffUserIds.suporte,
    name: "Juliana Prado",
    email: "suporte@wecod.com.br",
    business: "Suporte / CS",
    permissions: {
      alunos: FULL_ACCESS,
      comunidade: FULL_ACCESS,
      dashboard: VIEW_ONLY,
      teia: VIEW_ONLY,
    },
  },
];

export async function seed(knex: Knex): Promise<void> {
  const passwordHash = await hashPassword("123456");

  await knex("users").insert(
    staffSeeds.map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      password_hash: passwordHash,
      role: "staff" as const,
      business: s.business,
      status: "ativo" as const,
      last_access: new Date(),
    })),
  );

  await knex("staff_permissions").insert(
    staffSeeds.flatMap((s) =>
      MODULES.map((module) => {
        const grant = s.permissions[module];
        return {
          id: uuid(),
          user_id: s.id,
          module,
          can_view: grant?.view ?? false,
          can_create: grant?.create ?? false,
          can_edit: grant?.edit ?? false,
          can_delete: grant?.delete ?? false,
        };
      }),
    ),
  );
}
