import { createFileRoute } from "@tanstack/react-router";
import { Building2, Home, Library, MessagesSquare, Share2, UserRound } from "lucide-react";
import { PanelShell, type NavItem } from "@/components/PanelShell";
import { RequireAuth } from "@/components/RequireAuth";

export const Route = createFileRoute("/aluno")({
  component: AlunoLayout,
});

const nav: NavItem[] = [
  { to: "/aluno", label: "Início", icon: Home, exact: true },
  { to: "/aluno/biblioteca", label: "Biblioteca", icon: Library },
  { to: "/aluno/comunidade", label: "Comunidade", icon: MessagesSquare },
  { to: "/aluno/empresas", label: "Parceiros", icon: Building2 },
  { to: "/aluno/teia", label: "Teia", icon: Share2 },
  { to: "/aluno/perfil", label: "Meu perfil", icon: UserRound },
];

function AlunoLayout() {
  return (
    <RequireAuth roles={["aluno"]}>
      <PanelShell role="aluno" subtitle="Área do mentorado" nav={nav} />
    </RequireAuth>
  );
}
