import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ExternalLink, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FilterBar, type FilterConfig, type FilterValue } from "@/components/filters/FilterBar";
import { Pager } from "@/components/Pager";
import { financeSummary, listTransactions, syncSubscription } from "@/services/financeService";
import { listPlans } from "@/services/planService";
import { brl, brlShort, dateBR } from "@/lib/format";

export const Route = createFileRoute("/mentor/financeiro")({
  component: Financeiro,
});

function Financeiro() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<Record<string, FilterValue>>({});
  const [page, setPage] = useState(1);

  useEffect(() => setPage(1), [filters]);

  const { data: f } = useQuery({ queryKey: ["finance-summary"], queryFn: financeSummary });
  const { data: plans = [] } = useQuery({ queryKey: ["plans"], queryFn: () => listPlans() });

  const syncMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids) await syncSubscription(id);
    },
    onSuccess: () => {
      toast.success("Assinaturas sincronizadas com o Asaas");
      queryClient.invalidateQueries({ queryKey: ["finance-summary"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
  const { data: transactionsPage } = useQuery({
    queryKey: ["transactions", filters, page],
    queryFn: () =>
      listTransactions({
        status: (filters.status as string) || undefined,
        method: (filters.method as string) || undefined,
        planId: (filters.planId as string) || undefined,
        from: (filters.dateFrom as string) || undefined,
        to: (filters.dateTo as string) || undefined,
        page,
        perPage: 20,
      }),
  });
  const transactions = transactionsPage?.data ?? f?.recent ?? [];

  const filterConfig: FilterConfig[] = [
    {
      key: "status",
      type: "select",
      label: "Status",
      options: [
        { value: "aprovado", label: "Aprovado" },
        { value: "recusado", label: "Recusado" },
        { value: "pendente", label: "Pendente" },
      ],
    },
    {
      key: "method",
      type: "select",
      label: "Método",
      options: [
        { value: "cartao", label: "Cartão" },
        { value: "pix", label: "Pix" },
        { value: "boleto", label: "Boleto" },
      ],
    },
    {
      key: "planId",
      type: "select",
      label: "Plano",
      options: plans.map((p) => ({ value: p.id, label: p.name })),
    },
    { key: "date", type: "dateRange", label: "Data" },
  ];

  if (!f) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Financeiro</h1>
          <p className="text-sm text-muted-foreground">Receita recorrente e cobranças via Asaas.</p>
        </div>
        {f.late.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            disabled={syncMutation.isPending}
            onClick={() => syncMutation.mutate(f.late.map((s) => s.id))}
          >
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Sincronizar assinaturas em atraso
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="gap-1 p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">MRR</p>
          <p className="font-display text-2xl font-semibold">{brl(f.mrr)}</p>
        </Card>
        <Card className="gap-1 p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Assinaturas ativas
          </p>
          <p className="font-display text-2xl font-semibold">{f.activeCount}</p>
        </Card>
        <Card className="gap-1 p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Em atraso</p>
          <p className="font-display text-2xl font-semibold text-destructive">{f.lateCount}</p>
        </Card>
        <Card className="gap-1 p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Cancelamentos</p>
          <p className="font-display text-2xl font-semibold">{f.canceledCount}</p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4 sm:p-5">
          <p className="mb-4 text-sm font-medium">Receita nos últimos 12 meses</p>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={f.revenueSeries}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10 }}
                  interval="preserveStartEnd"
                  minTickGap={14}
                />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => brlShort(Number(v))} />
                <Tooltip formatter={(v) => brl(Number(v))} />
                <Area
                  type="monotone"
                  dataKey="receita"
                  stroke="var(--chart-1)"
                  fill="var(--chart-1)"
                  fillOpacity={0.18}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <p className="mb-4 text-sm font-medium">Assinantes por plano</p>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={f.byPlan}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="plan" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <FilterBar
        filters={filterConfig}
        values={filters}
        onChange={(key, value) => setFilters((v) => ({ ...v, [key]: value }))}
        onClear={() => setFilters({})}
      />

      <Card className="overflow-x-auto p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Aluno</TableHead>
              <TableHead className="hidden md:table-cell">Data</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead className="hidden sm:table-cell">Forma</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((t) => (
              <TableRow key={t.id}>
                <TableCell>{t.user_name ?? "—"}</TableCell>
                <TableCell className="hidden md:table-cell">{dateBR(t.date)}</TableCell>
                <TableCell>{brl(Number(t.amount))}</TableCell>
                <TableCell className="hidden capitalize sm:table-cell">{t.method}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      t.status === "aprovado"
                        ? "success"
                        : t.status === "recusado"
                          ? "destructive"
                          : "secondary"
                    }
                    className="capitalize"
                  >
                    {t.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {t.invoice_url && (
                    <a
                      href={t.invoice_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      Fatura <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Pager
        page={transactionsPage?.meta.page ?? 1}
        totalPages={transactionsPage?.meta.totalPages ?? 1}
        onPageChange={setPage}
      />
    </div>
  );
}
