import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FilterBar, type FilterConfig, type FilterValue } from "@/components/filters/FilterBar";
import { Pager } from "@/components/Pager";
import { listStudents } from "@/services/studentService";
import { daysSince, minutesLabel } from "@/lib/format";

export const Route = createFileRoute("/mentor/alunos")({
  component: Alunos,
});

function Alunos() {
  const [values, setValues] = useState<Record<string, FilterValue>>({});
  const [sortByTime, setSortByTime] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => setPage(1), [values, sortByTime]);

  const { data } = useQuery({
    queryKey: ["students", values, sortByTime, page],
    queryFn: () =>
      listStudents({
        q: (values.q as string) || undefined,
        status: (values.status as "ativo" | "inativo") || undefined,
        createdFrom: (values.createdFrom as string) || undefined,
        createdTo: (values.createdTo as string) || undefined,
        lastAccessFrom: (values.lastAccessFrom as string) || undefined,
        lastAccessTo: (values.lastAccessTo as string) || undefined,
        sort: sortByTime ? "tempo_assistido" : undefined,
        page,
        perPage: 5,
      }),
  });
  const students = data?.data ?? [];

  const filters: FilterConfig[] = [
    { key: "q", type: "search", label: "Busca", placeholder: "Nome ou empresa…" },
    {
      key: "status",
      type: "select",
      label: "Status",
      options: [
        { value: "ativo", label: "Ativo" },
        { value: "inativo", label: "Inativo" },
      ],
    },
    { key: "created", type: "dateRange", label: "Data de cadastro" },
    { key: "lastAccess", type: "dateRange", label: "Último acesso" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Alunos</h1>
        <p className="text-sm text-muted-foreground">
          {data?.meta.total ?? 0} mentorados na plataforma
        </p>
      </div>

      <FilterBar
        filters={filters}
        values={values}
        onChange={(key, value) => setValues((v) => ({ ...v, [key]: value }))}
        onClear={() => setValues({})}
      />

      <div className="flex justify-end">
        <Button
          variant={sortByTime ? "default" : "outline"}
          size="sm"
          onClick={() => setSortByTime((v) => !v)}
        >
          Ordenar por tempo assistido
        </Button>
      </div>

      <Card className="overflow-x-auto p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Aluno</TableHead>
              <TableHead>Progresso</TableHead>
              <TableHead className="hidden md:table-cell">Tempo</TableHead>
              <TableHead className="hidden lg:table-cell">Último acesso</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((s) => (
              <TableRow key={s.id} className="cursor-pointer">
                <TableCell>
                  <Link to="/mentor/aluno/$id" params={{ id: s.id }} className="block">
                    <span className="font-medium">{s.name}</span>
                    <span className="block text-xs text-muted-foreground">{s.business}</span>
                  </Link>
                </TableCell>
                <TableCell className="w-28 md:w-40">
                  <Progress value={s.completion.pct} className="h-1.5" />
                  <span className="text-[11px] text-muted-foreground">{s.completion.pct}%</span>
                </TableCell>
                <TableCell className="hidden text-sm md:table-cell">
                  {minutesLabel(s.minutesWatched)}
                </TableCell>
                <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                  há {daysSince(s.last_access)} dias
                </TableCell>
                <TableCell>
                  <Badge
                    className={
                      s.active
                        ? "bg-success/15 text-success hover:bg-success/15"
                        : "bg-destructive/10 text-destructive hover:bg-destructive/10"
                    }
                  >
                    {s.active ? "ativo" : "inativo"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Pager
        page={data?.meta.page ?? 1}
        totalPages={data?.meta.totalPages ?? 1}
        onPageChange={setPage}
      />
    </div>
  );
}
