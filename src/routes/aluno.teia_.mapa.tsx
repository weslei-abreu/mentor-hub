import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TeiaGraph3D } from "@/components/teia/TeiaGraph3D";
import { getGraph, createRequest } from "@/services/teiaService";
import { useAuth } from "@/store/auth";

export const Route = createFileRoute("/aluno/teia_/mapa")({
  component: TeiaMapaPage,
});

function TeiaMapaPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data } = useQuery({ queryKey: ["teia-graph"], queryFn: () => getGraph() });

  const requestMutation = useMutation({
    mutationFn: (contactId: string) => createRequest(contactId),
    onSuccess: () => {
      toast.success("Solicitação enviada");
      queryClient.invalidateQueries({ queryKey: ["teia-contacts"] });
    },
  });

  return (
    <div className="flex h-[calc(100vh-6rem)] flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Teia — visão 3D</h1>
          <p className="text-sm text-muted-foreground">
            Explore a rede de contatos a partir de {user?.name}.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/aluno/teia">
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Voltar à lista
          </Link>
        </Button>
      </div>

      <TeiaGraph3D
        nodes={data?.nodes ?? []}
        links={data?.links ?? []}
        rootId={user?.id}
        allowRequest
        onRequest={(id) => requestMutation.mutate(id)}
        requestPending={requestMutation.isPending}
      />
    </div>
  );
}
