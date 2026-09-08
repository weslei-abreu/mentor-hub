import { Link, Outlet, useNavigate } from "@tanstack/react-router";
import { Menu, LogOut, GraduationCap, LineChart } from "lucide-react";
import { useState, type ComponentType } from "react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/store/auth";
import { BRAND } from "@/types";
import { cn } from "@/lib/utils";

export interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  exact?: boolean;
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
  const RoleIcon = role === "mentor" ? LineChart : GraduationCap;

  async function handleLogout() {
    await logout();
    navigate({ to: "/login" });
  }

  const navList = (onNavigate?: () => void) => (
    <nav className="flex flex-col gap-1">
      {nav.map((item) => (
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
          <Outlet />
        </div>
      </main>
    </div>
  );
}
