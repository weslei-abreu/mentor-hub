import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, Lightbulb, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { mentorDashboard } from "@/services/dashboardService";
import { minutesLabel } from "@/lib/format";
import { useIsMobile } from "@/hooks/use-mobile";

export const Route = createFileRoute("/mentor/")({
  component: MentorDashboard,
});

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

function MentorDashboard() {
  const isMobile = useIsMobile();
  const { data } = useQuery({ queryKey: ["dashboard-mentor"], queryFn: mentorDashboard });

  if (!data) return null;
  const { kpis, accessSeries, completionByTag, topVideos, interestDist, insights } = data;

  const kpiCards = [
    {
      label: "Alunos ativos",
      value: `${kpis.active}/${kpis.total}`,
      hint: "acesso nos últimos 7 dias",
    },
    {
      label: "Alunos inativos",
      value: String(kpis.inactive),
      hint: "sem acessar há mais de 7 dias",
    },
    { label: "Tempo médio assistido", value: minutesLabel(kpis.avgMinutes), hint: "por aluno" },
    { label: "Conclusão média", value: `${kpis.avgCompletion}%`, hint: "das aulas iniciadas" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Visão geral da sua mentoria nos últimos 30 dias.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((k) => (
          <Card key={k.label} className="gap-1 p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{k.label}</p>
            <p className="font-display text-2xl font-semibold">{k.value}</p>
            <p className="text-[11px] text-muted-foreground">{k.hint}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4 sm:p-5">
          <p className="mb-4 text-sm font-medium">Acessos por dia</p>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={accessSeries}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10 }}
                  interval={isMobile ? 9 : 4}
                  minTickGap={12}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="acessos"
                  stroke="var(--chart-1)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <p className="mb-4 text-sm font-medium">Conclusão média por tema</p>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={completionByTag}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="tag"
                  tick={{ fontSize: isMobile ? 9 : 10 }}
                  interval={0}
                  angle={isMobile ? -35 : -12}
                  textAnchor="end"
                  height={isMobile ? 62 : 48}
                />
                <YAxis tick={{ fontSize: 11 }} unit="%" />
                <Tooltip formatter={(v) => `${v}%`} />
                <Bar dataKey="conclusao" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <p className="mb-4 text-sm font-medium">Vídeos mais assistidos</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topVideos} layout="vertical" margin={{ left: 12 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="title"
                  width={isMobile ? 96 : 150}
                  tick={{ fontSize: isMobile ? 9 : 10 }}
                />
                <Tooltip />
                <Bar dataKey="alunos" fill="var(--chart-1)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <p className="mb-4 text-sm font-medium">Distribuição de interesse</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={interestDist}
                  dataKey="alunos"
                  nameKey="tag"
                  outerRadius={isMobile ? 78 : 95}
                  label={!isMobile}
                >
                  {interestDist.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
          <Lightbulb className="h-4 w-4 text-primary" /> Insights do mentor
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {insights.map((i) => (
            <Card key={i.id} className="gap-3 p-5">
              <Badge
                className={
                  i.severity === "alerta"
                    ? "w-fit bg-destructive/10 text-destructive hover:bg-destructive/10"
                    : i.severity === "atencao"
                      ? "w-fit bg-warning/15 text-warning-foreground hover:bg-warning/15"
                      : "w-fit bg-success/15 text-success hover:bg-success/15"
                }
              >
                {i.severity === "oportunidade" ? (
                  <TrendingUp className="mr-1 h-3 w-3" />
                ) : (
                  <AlertTriangle className="mr-1 h-3 w-3" />
                )}
                {i.severity}
              </Badge>
              <p className="text-sm font-medium">{i.title}</p>
              <p className="text-xs leading-relaxed text-muted-foreground">{i.detail}</p>
              {i.names && (
                <p className="text-[11px] text-muted-foreground">{i.names.join(" · ")}</p>
              )}
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
