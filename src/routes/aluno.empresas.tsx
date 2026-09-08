import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { listCompanies } from "@/services/companyService";

export const Route = createFileRoute("/aluno/empresas")({
  component: EmpresasPage,
});

function EmpresasPage() {
  const { data: companies = [] } = useQuery({ queryKey: ["companies"], queryFn: listCompanies });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Empresas parceiras</h1>
        <p className="text-sm text-muted-foreground">Quem assina os conteúdos da plataforma.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {companies.map((c) => (
          <Link key={c.id} to="/aluno/empresa/$id" params={{ id: c.id }}>
            <Card className="h-full gap-3 p-5 transition-colors hover:border-primary/40">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-foreground text-xs font-semibold text-background">
                {c.logo}
              </span>
              <div>
                <p className="font-medium">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.field}</p>
              </div>
              <p className="line-clamp-3 text-sm text-muted-foreground">{c.description}</p>
              <span className="mt-auto flex items-center gap-1 text-xs font-medium text-primary">
                Ver perfil <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
