import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { VideoCard } from "@/components/VideoCard";
import { Card } from "@/components/ui/card";
import { getCompany } from "@/services/companyService";
import { listVideos } from "@/services/videoService";

export const Route = createFileRoute("/aluno/empresa/$id")({
  component: EmpresaPage,
});

function EmpresaPage() {
  const { id } = Route.useParams();
  const { data: company } = useQuery({ queryKey: ["company", id], queryFn: () => getCompany(id) });
  const { data: videosPage } = useQuery({
    queryKey: ["videos", { companyId: id }],
    queryFn: () => listVideos({ companyId: id, perPage: 100 }),
  });
  const videos = videosPage?.data ?? [];

  if (!company) return null;

  return (
    <div className="space-y-6">
      <Card className="gap-3 p-6">
        <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-foreground text-sm font-semibold text-background">
          {company.logo}
        </span>
        <h1 className="font-display text-2xl font-semibold">{company.name}</h1>
        <p className="text-sm text-muted-foreground">{company.field}</p>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {company.description}
        </p>
      </Card>

      <section>
        <h2 className="mb-3 font-display text-lg font-semibold">
          Aulas desta empresa ({videos.length})
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((v) => (
            <VideoCard key={v.id} video={v} />
          ))}
        </div>
      </section>
    </div>
  );
}
