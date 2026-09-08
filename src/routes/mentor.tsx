import { createFileRoute } from "@tanstack/react-router";
import {
  LayoutDashboard,
  MessagesSquare,
  PlaySquare,
  Share2,
  UserCog,
  Users,
  Wallet,
} from "lucide-react";
import { PanelShell, type NavItem } from "@/components/PanelShell";
import { RequireAuth } from "@/components/RequireAuth";

export const Route = createFileRoute("/mentor")({
  component: MentorLayout,
});

const nav: NavItem[] = [
  { to: "/mentor", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/mentor/alunos", label: "Alunos", icon: Users },
  { to: "/mentor/conteudo", label: "Conteúdo", icon: PlaySquare },
  { to: "/mentor/comunidade", label: "Comunidade", icon: MessagesSquare },
  { to: "/mentor/financeiro", label: "Financeiro", icon: Wallet },
  { to: "/mentor/teia", label: "Teia", icon: Share2 },
  { to: "/mentor/usuarios", label: "Usuários", icon: UserCog },
  { to: "/mentor/lp", label: "Landing page", icon: LayoutDashboard },
];

function MentorLayout() {
  return (
    <RequireAuth roles={["admin", "mentor"]}>
      <PanelShell role="mentor" subtitle="Painel do mentor" nav={nav} />
    </RequireAuth>
  );
}
