import { createFileRoute } from "@tanstack/react-router";
import { CommunityFeed } from "@/components/CommunityFeed";

export const Route = createFileRoute("/aluno/comunidade")({
  component: () => (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Comunidade</h1>
        <p className="text-sm text-muted-foreground">Quem está aplicando, compartilha aqui.</p>
      </div>
      <CommunityFeed />
    </div>
  ),
});
