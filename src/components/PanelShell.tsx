import { Link, Navigate, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { Menu, LogOut, GraduationCap, LineChart, ShieldAlert } from "lucide-react";
import { useState, type ComponentType } from "react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/store/auth";
import { BRAND, hasAnyAccess, type Module } from "@/types";
import { cn } from "@/lib/utils";

export interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  exact?: boolean;
  // Módulo dono desta seção, usado para restringir o menu e o acesso à rota
  // para usuários staff. Itens sem módulo (ex.: páginas do aluno) nunca são
  // restringidos.
  module?: Module;
  // Prefixos de rota adicionais que também pertencem a este módulo (ex.: a
  // página de detalhe de um aluno vive em /mentor/aluno/:id, fora do prefixo
  // /mentor/alunos do item de menu). Por padrão só `to` é considerado.
  matchPrefixes?: string[];
}

function itemMatchesPath(item: NavItem, pathname: string): boolean {
  if (item.exact) return pathname === item.to;
  const prefixes = item.matchPrefixes ?? [item.to];
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function PanelShell({
  role,
  subtitle,
  nav,
}: {
  role: "mentor" | "aluno";
  subtitle: string;
  nav: NavItem[];
}) {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const RoleIcon = role === "mentor" ? LineChart : GraduationCap;

  const isStaff = user?.role === "staff";
  const permissions = user?.permissions ?? null;

  function hasAccess(item: NavItem): boolean {
    if (!isStaff || !item.module) return true;
    return hasAnyAccess(permissions?.[item.module]);
  }

  const visibleNav = nav.filter(hasAccess);

  async function handleLogout() {
    await logout();
    navigate({ to: "/login" });
  }

  const navList = (onNavigate?: () => void) => (
    <nav className="flex flex-col gap-1">
      {visibleNav.map((item) => (
        <Link
          key={item.to}
          to={item.to as never}
          onClick={onNavigate}
          activeOptions={{ exact: item.exact ?? false }}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
          activeProps={{ className: "bg-sidebar-accent text-sidebar-foreground font-medium" }}
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </Link>
      ))}
    </nav>
  );

  const brandBlock = (
    <div className="flex items-center gap-3 px-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
        <RoleIcon className="h-4 w-4" />
      </div>
      <div className="min-w-0 leading-tight">
        <p className="font-display text-sm font-semibold text-sidebar-foreground">{BRAND.name}</p>
        <p className="truncate text-[11px] text-sidebar-foreground/60">{subtitle}</p>
      </div>
    </div>
  );

  const footer = (
    <div className="space-y-1 border-t border-sidebar-border px-3 pt-4">
      <p className="truncate px-0 pb-1 text-[11px] text-sidebar-foreground/60">{user?.name}</p>
      <button
        onClick={handleLogout}
        className="flex w-full items-center gap-2 rounded-lg px-0 py-1.5 text-xs text-sidebar-foreground/70 hover:text-sidebar-foreground"
      >
        <LogOut className="h-3.5 w-3.5" />
        Sair
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col gap-6 bg-sidebar py-5 lg:flex">
        {brandBlock}
        <div className="flex flex-col gap-6 overflow-y-auto px-2">
          {navList()}
          <div className="px-1">{footer}</div>
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger className="rounded-md border border-border p-2">
            <Menu className="h-4 w-4" />
          </SheetTrigger>
          <SheetContent side="left" className="flex w-64 flex-col gap-6 bg-sidebar py-5">
            <SheetTitle className="sr-only">Navegação</SheetTitle>
            {brandBlock}
            <div className="px-2">{navList(() => setOpen(false))}</div>
            {footer}
          </SheetContent>
        </Sheet>
        <span className="min-w-0 truncate font-display text-sm font-semibold">{BRAND.name}</span>
        <span className="hidden min-w-0 truncate text-xs text-muted-foreground xs:inline sm:inline">
          · {subtitle}
        </span>
      </header>

      <main className={cn("lg:pl-60")}>
        <div className="mx-auto max-w-[1600px] px-4 pb-20 pt-6 md:px-8 md:py-10 lg:pb-10">
          <ModuleGuardedContent
            isStaff={isStaff}
            currentItem={nav.find((item) => itemMatchesPath(item, pathname))}
            hasAccess={hasAccess}
            fallbackTo={visibleNav[0]?.to}
          />
        </div>
      </main>
    </div>
  );
}

// Um staff pode digitar a URL de um módulo sem acesso diretamente — o menu
// já esconde o link, mas a rota em si também precisa recusar o conteúdo, daí
// esse guard em volta do Outlet (não basta esconder no menu).
function ModuleGuardedContent({
  isStaff,
  currentItem,
  hasAccess,
  fallbackTo,
}: {
  isStaff: boolean;
  currentItem: NavItem | undefined;
  hasAccess: (item: NavItem) => boolean;
  fallbackTo: string | undefined;
}) {
  if (isStaff && currentItem && !hasAccess(currentItem)) {
    if (fallbackTo) {
      return <Navigate to={fallbackTo as never} />;
    }
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-10 text-center">
        <ShieldAlert className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium">Você não tem acesso a nenhum módulo</p>
        <p className="text-xs text-muted-foreground">
          Fale com um administrador para liberar seu acesso.
        </p>
      </div>
    );
  }

  return <Outlet />;
}
