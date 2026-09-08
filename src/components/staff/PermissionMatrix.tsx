import type { Capability, Module, ModulePermissions, PermissionMap } from "@/types";
import { cn } from "@/lib/utils";

const MODULE_LABELS: Record<Module, string> = {
  dashboard: "Dashboard",
  alunos: "Alunos",
  conteudo: "Conteúdo",
  comunidade: "Comunidade",
  financeiro: "Financeiro",
  teia: "Teia",
  usuarios: "Usuários",
  lp: "Landing page",
  staff: "Equipe",
};

const CAPABILITY_LABELS: Record<Capability, string> = {
  view: "Ver",
  create: "Criar",
  edit: "Editar",
  delete: "Excluir",
};

const CAPABILITY_ORDER: Capability[] = ["view", "create", "edit", "delete"];
const MODULE_ORDER: Module[] = [
  "dashboard",
  "alunos",
  "conteudo",
  "comunidade",
  "financeiro",
  "teia",
  "usuarios",
  "lp",
  "staff",
];

const NO_ACCESS: ModulePermissions = { view: false, create: false, edit: false, delete: false };
const FULL_ACCESS: ModulePermissions = { view: true, create: true, edit: true, delete: true };

function isNone(p: ModulePermissions) {
  return !p.view && !p.create && !p.edit && !p.delete;
}

function isAll(p: ModulePermissions) {
  return p.view && p.create && p.edit && p.delete;
}

// Largura fixa (não relativa ao viewport) pro grupo de botões — um grid com
// breakpoint `sm:` fica preso numa única coluna do grid externo quando o
// modal é mais estreito que o breakpoint, espremendo os rótulos. Largura
// fixa em px evita esse problema completamente.
const GROUP_CLASS = "grid w-[420px] shrink-0 grid-cols-6 gap-2";

export function PermissionMatrix({
  value,
  onChange,
}: {
  value: PermissionMap;
  onChange: (module: Module, permissions: ModulePermissions) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <div className="min-w-[640px]">
        <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/40 px-3 py-2">
          <span className="text-xs font-medium text-muted-foreground">Módulo</span>
          <div className={GROUP_CLASS}>
            <span className="text-center text-[10px] font-medium text-muted-foreground">
              Nenhum
            </span>
            {CAPABILITY_ORDER.map((cap) => (
              <span key={cap} className="text-center text-[10px] font-medium text-muted-foreground">
                {CAPABILITY_LABELS[cap]}
              </span>
            ))}
            <span className="text-center text-[10px] font-medium text-muted-foreground">Todos</span>
          </div>
        </div>
        <div className="divide-y divide-border">
          {MODULE_ORDER.map((module) => {
            const current = value[module] ?? NO_ACCESS;
            return (
              <div key={module} className="flex items-center justify-between gap-2 px-3 py-2.5">
                <span className="truncate pr-2 text-sm">{MODULE_LABELS[module]}</span>
                <div className={GROUP_CLASS}>
                  <button
                    type="button"
                    onClick={() => onChange(module, NO_ACCESS)}
                    className={cn(
                      "rounded-md border px-2 py-1.5 text-xs font-medium transition-colors",
                      isNone(current)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground hover:border-primary/40",
                    )}
                  >
                    Nenhum
                  </button>
                  {CAPABILITY_ORDER.map((cap) => (
                    <button
                      key={cap}
                      type="button"
                      onClick={() => onChange(module, { ...current, [cap]: !current[cap] })}
                      className={cn(
                        "rounded-md border px-2 py-1.5 text-xs font-medium transition-colors",
                        current[cap]
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-muted-foreground hover:border-primary/40",
                      )}
                    >
                      {CAPABILITY_LABELS[cap]}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => onChange(module, FULL_ACCESS)}
                    className={cn(
                      "rounded-md border px-2 py-1.5 text-xs font-medium transition-colors",
                      isAll(current)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground hover:border-primary/40",
                    )}
                  >
                    Todos
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function permissionSummary(value: PermissionMap): string {
  const active = Object.values(value).filter(
    (p): p is ModulePermissions => !!p && !isNone(p),
  ).length;
  if (active === 0) return "Nenhum módulo liberado";
  return `${active} módulo${active > 1 ? "s" : ""} liberado${active > 1 ? "s" : ""}`;
}
