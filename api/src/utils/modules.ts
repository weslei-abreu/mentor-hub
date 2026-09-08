export const MODULES = [
  "dashboard",
  "alunos",
  "conteudo",
  "comunidade",
  "financeiro",
  "teia",
  "usuarios",
  "lp",
  "staff",
] as const;

export type Module = (typeof MODULES)[number];

export const CAPABILITIES = ["view", "create", "edit", "delete"] as const;

export type Capability = (typeof CAPABILITIES)[number];

export interface ModulePermissions {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

export function noAccess(): ModulePermissions {
  return { view: false, create: false, edit: false, delete: false };
}

export function hasAnyAccess(permissions: ModulePermissions): boolean {
  return permissions.view || permissions.create || permissions.edit || permissions.delete;
}
