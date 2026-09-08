import { createFileRoute } from "@tanstack/react-router";
import {
  LayoutDashboard,
  MessagesSquare,
  PlaySquare,
  Share2,
  ShieldCheck,
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
  { to: "/mentor", label: "Dashboard", icon: LayoutDashboard, exact: true, module: "dashboard" },
  {
    to: "/mentor/alunos",
    label: "Alunos",
    icon: Users,
    module: "alunos",
    matchPrefixes: ["/mentor/alunos", "/mentor/aluno"],
  },
  { to: "/mentor/conteudo", label: "Conteúdo", icon: PlaySquare, module: "conteudo" },
  { to: "/mentor/comunidade", label: "Comunidade", icon: MessagesSquare, module: "comunidade" },
  { to: "/mentor/financeiro", label: "Financeiro", icon: Wallet, module: "financeiro" },
  { to: "/mentor/teia", label: "Teia", icon: Share2, module: "teia" },
  { to: "/mentor/usuarios", label: "Usuários", icon: UserCog, module: "usuarios" },
  { to: "/mentor/lp", label: "Landing page", icon: LayoutDashboard, module: "lp" },
  { to: "/mentor/staff", label: "Equipe", icon: ShieldCheck, module: "staff" },
];

function MentorLayout() {
  return (
    <RequireAuth roles={["admin", "mentor", "staff"]}>
      <PanelShell role="mentor" subtitle="Painel do mentor" nav={nav} />
    </RequireAuth>
  );
}
