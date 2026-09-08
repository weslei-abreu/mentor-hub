import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PlayCircle, Sparkles, TrendingUp } from "lucide-react";
import { Thumb } from "@/components/Thumb";
import { VideoCard } from "@/components/VideoCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { alunoDashboard } from "@/services/dashboardService";
import { minutesLabel } from "@/lib/format";
import { useAuth } from "@/store/auth";

export const Route = createFileRoute("/aluno/")({
  component: AlunoHome,
});

function AlunoHome() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({ queryKey: ["dashboard-aluno"], queryFn: alunoDashboard });

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const { continuing, news, recommended, done, totalVideos, totalMinutes } = data;

  return (
    <div className="space-y-10">
      <div>
        <p className="text-sm text-muted-foreground">Bem-vindo de volta,</p>
        <h1 className="font-display text-2xl font-semibold">{user?.name.split(" ")[0]}</h1>
      </div>

      {continuing && (
        <Card className="overflow-hidden border-none p-0 shadow-lift">
          <div className="surface-ink relative grid gap-6 p-6 md:grid-cols-[220px_1fr] md:p-8">
            <div className="bg-grid-faint pointer-events-none absolute inset-0 opacity-40" />
            <Thumb
              tag={continuing.tags[0] ?? "Processos"}
              duration={continuing.duration}
              className="relative h-32 md:h-full"
              imageUrl={continuing.thumbnail_url}
            />
            <div className="relative flex flex-col justify-center">
              <span className="text-xs uppercase tracking-widest text-ink-muted">
                Continue assistindo
              </span>
              <h2 className="mt-2 font-display text-xl font-semibold text-ink-foreground md:text-2xl">
                {continuing.title}
              </h2>
              <p className="mt-2 max-w-xl text-sm text-ink-muted">{continuing.description}</p>
              <div className="mt-4 max-w-sm">
                <Progress value={continuing.progress} className="h-1.5" />
                <p className="mt-1.5 text-xs text-ink-muted">
                  {continuing.progress}% concluído · {continuing.company_name}
                </p>
              </div>
              <Button asChild className="mt-5 w-fit" size="lg">
                <Link to="/aluno/video/$id" params={{ id: continuing.id }}>
                  <PlayCircle className="mr-1.5 h-4 w-4" />
                  Retomar aula
                </Link>
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="gap-1 p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Aulas concluídas</p>
          <p className="font-display text-3xl font-semibold">
            {done}
            <span className="text-base font-normal text-muted-foreground">/{totalVideos}</span>
          </p>
          <Progress
            value={totalVideos > 0 ? (done / totalVideos) * 100 : 0}
            className="mt-2 h-1.5"
          />
        </Card>
        <Card className="gap-1 p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Tempo assistido</p>
          <p className="font-display text-3xl font-semibold">{minutesLabel(totalMinutes)}</p>
        </Card>
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
            <Sparkles className="h-4 w-4 text-primary" /> Novidades
          </h2>
          <Button asChild variant="ghost" size="sm">
            <Link to="/aluno/biblioteca">Ver biblioteca</Link>
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {news.map((v) => (
            <VideoCard key={v.id} video={v} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold">
          <TrendingUp className="h-4 w-4 text-primary" /> Recomendados para você
        </h2>
        {recommended.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {recommended.map((v) => (
              <VideoCard key={v.id} video={v} />
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center text-sm text-muted-foreground">
            Você já concluiu tudo dos seus temas favoritos. Explore a biblioteca para achar um novo
            desafio.
          </Card>
        )}
      </section>
    </div>
  );
}
