import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getStudent } from "@/services/studentService";
import { daysSince, minutesLabel } from "@/lib/format";

export const Route = createFileRoute("/mentor/aluno/$id")({
  component: AlunoDetalhe,
});

function AlunoDetalhe() {
  const { id } = Route.useParams();
  const { data: s } = useQuery({ queryKey: ["student", id], queryFn: () => getStudent(id) });

  if (!s) return null;

  const byTag = s.progressByTag ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-foreground text-base font-semibold text-background">
            {s.name
              .split(" ")
              .map((p) => p[0])
              .slice(0, 2)
              .join("")}
          </span>
          <div>
            <h1 className="font-display text-2xl font-semibold">{s.name}</h1>
            <p className="text-sm text-muted-foreground">
              {s.business} · {s.email}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="gap-1 p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Conclusão</p>
          <p className="font-display text-2xl font-semibold">{s.completion.pct}%</p>
        </Card>
        <Card className="gap-1 p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Tempo assistido</p>
          <p className="font-display text-2xl font-semibold">{minutesLabel(s.minutesWatched)}</p>
        </Card>
        <Card className="gap-1 p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Último acesso</p>
          <p className="font-display text-2xl font-semibold">há {daysSince(s.last_access)} dias</p>
        </Card>
        <Card className="gap-1 p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Status</p>
          <Badge
            className={
              s.active
                ? "w-fit bg-success/15 text-success hover:bg-success/15"
                : "w-fit bg-destructive/10 text-destructive hover:bg-destructive/10"
            }
          >
            {s.active ? "ativo" : "inativo"}
          </Badge>
        </Card>
      </div>

      <Card className="p-5">
        <p className="mb-4 text-sm font-medium">Progresso por tema</p>
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byTag.map((t) => ({ tema: t.tag, conclusao: t.pct }))}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="tema"
                tick={{ fontSize: 10 }}
                interval={0}
                angle={-12}
                textAnchor="end"
                height={48}
              />
              <YAxis tick={{ fontSize: 11 }} unit="%" />
              <Tooltip formatter={(v) => `${v}%`} />
              <Bar dataKey="conclusao" fill="var(--chart-3)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="gap-3 p-5">
        <p className="text-sm font-medium">Temas de maior interesse</p>
        <div className="flex flex-wrap gap-2">
          {(s.tagInterest ?? [])
            .filter((t) => t.score > 0)
            .slice(0, 3)
            .map((t) => (
              <Badge key={t.tag} variant="secondary" className="font-normal">
                {t.tag}
              </Badge>
            ))}
        </div>
      </Card>

      <Card className="divide-y divide-border p-0">
        {(s.watched ?? []).map((v) => (
          <div key={v.id} className="flex items-center gap-4 p-4">
            <p className="flex-1 text-sm">{v.title}</p>
            <div className="w-32">
              <Progress value={v.progress} className="h-1.5" />
              <p className="mt-1 text-right text-[11px] text-muted-foreground">{v.progress}%</p>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
