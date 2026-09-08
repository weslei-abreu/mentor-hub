import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TeiaGraph3D } from "@/components/teia/TeiaGraph3D";
import { getAdminGraph } from "@/services/teiaService";

export const Route = createFileRoute("/mentor/teia_/mapa")({
  component: TeiaAdminMapaPage,
});

function TeiaAdminMapaPage() {
  const { data } = useQuery({ queryKey: ["teia-admin-graph"], queryFn: getAdminGraph });

  return (
    <div className="flex h-[calc(100vh-6rem)] flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Teia — visão 3D</h1>
          <p className="text-sm text-muted-foreground">
            Toda a rede de contatos construída pelos membros do clube.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/mentor/teia">
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Voltar
          </Link>
        </Button>
      </div>

      <TeiaGraph3D nodes={data?.nodes ?? []} links={data?.links ?? []} />
    </div>
  );
}
