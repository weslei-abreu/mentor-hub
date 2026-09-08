import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Award, CreditCard, ExternalLink, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listPlans } from "@/services/planService";
import { myProgress } from "@/services/studentService";
import {
  cancelSubscription,
  mySubscription,
  myTransactions,
  syncMySubscription,
} from "@/services/financeService";
import { brl, dateBR } from "@/lib/format";
import { useAuth } from "@/store/auth";
import { useIsMobile } from "@/hooks/use-mobile";

export const Route = createFileRoute("/aluno/perfil")({
  component: Perfil,
});

function Perfil() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [confirm, setConfirm] = useState(false);

  const { data: progressData } = useQuery({ queryKey: ["my-progress"], queryFn: myProgress });
  const { data: subscription } = useQuery({
    queryKey: ["my-subscription"],
    queryFn: mySubscription,
  });
  const { data: transactions = [] } = useQuery({
    queryKey: ["my-transactions"],
    queryFn: myTransactions,
  });
  const { data: plans = [] } = useQuery({ queryKey: ["plans"], queryFn: () => listPlans() });

  const cancelMutation = useMutation({
    mutationFn: cancelSubscription,
    onSuccess: () => {
      toast.success("Assinatura cancelada");
      setConfirm(false);
      queryClient.invalidateQueries({ queryKey: ["my-subscription"] });
    },
  });

  const syncMutation = useMutation({
    mutationFn: syncMySubscription,
    onSuccess: () => {
      toast.success("Assinatura sincronizada com o Asaas");
      queryClient.invalidateQueries({ queryKey: ["my-subscription"] });
      queryClient.invalidateQueries({ queryKey: ["my-transactions"] });
    },
  });

  const byTag = progressData?.progressByTag ?? [];
  const watched = progressData?.watched ?? [];

  return (
    <div className="space-y-6">
      <div className="flex min-w-0 items-center gap-4">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-foreground text-base font-semibold text-background">
          {user?.name
            .split(" ")
            .map((p) => p[0])
            .slice(0, 2)
            .join("")}
        </span>
        <div>
          <h1 className="truncate font-display text-xl font-semibold sm:text-2xl">{user?.name}</h1>
          <p className="break-words text-xs text-muted-foreground sm:text-sm">
            {user?.email} · {user?.business}
          </p>
        </div>
      </div>

      <Tabs defaultValue="progresso">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="progresso">Progresso</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
          <TabsTrigger value="assinatura">Minha assinatura</TabsTrigger>
        </TabsList>

        <TabsContent value="progresso" className="mt-5 space-y-4">
          <Card className="p-4 sm:p-5">
            <p className="mb-4 text-sm font-medium">Progresso por tema</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byTag.map((t) => ({ tema: t.tag, conclusao: t.pct }))}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis
                    dataKey="tema"
                    tick={{ fontSize: isMobile ? 9 : 11 }}
                    interval={0}
                    angle={isMobile ? -35 : -12}
                    textAnchor="end"
                    height={isMobile ? 62 : 50}
                  />
                  <YAxis tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip formatter={(v) => `${v}%`} />
                  <Bar dataKey="conclusao" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="gap-3 p-5">
            <p className="flex items-center gap-2 text-sm font-medium">
              <Award className="h-4 w-4 text-primary" /> Certificados
            </p>
            {byTag.filter((t) => t.pct === 100).length ? (
              <div className="flex flex-wrap gap-2">
                {byTag
                  .filter((t) => t.pct === 100)
                  .map((t) => (
                    <Badge key={t.tag} className="bg-success/15 text-success hover:bg-success/15">
                      Trilha {t.tag} concluída
                    </Badge>
                  ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Conclua 100% das aulas de um tema para liberar o certificado.
              </p>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="historico" className="mt-5">
          <Card className="divide-y divide-border p-0">
            {watched.length === 0 && (
              <p className="p-8 text-center text-sm text-muted-foreground">
                Você ainda não assistiu nenhuma aula.
              </p>
            )}
            {watched.map((v) => (
              <Link
                key={v.id}
                to="/aluno/video/$id"
                params={{ id: v.id }}
                className="flex items-center gap-4 p-4 hover:bg-muted/50"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium">{v.title}</p>
                  <p className="text-xs text-muted-foreground">{v.tags.join(" · ")}</p>
                </div>
                <div className="w-32">
                  <Progress value={v.progress} className="h-1.5" />
                  <p className="mt-1 text-right text-[11px] text-muted-foreground">{v.progress}%</p>
                </div>
              </Link>
            ))}
          </Card>
        </TabsContent>

        <TabsContent value="assinatura" className="mt-5 space-y-4">
          <Card className="gap-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Plano atual</p>
                <p className="font-display text-xl font-semibold">
                  {subscription?.plan_name ?? "—"}
                </p>
                {subscription && (
                  <p className="text-sm text-muted-foreground">
                    {brl(Number(subscription.amount))} · próxima cobrança em{" "}
                    {dateBR(subscription.next_charge)}
                  </p>
                )}
              </div>
              {subscription && (
                <Badge
                  variant={
                    subscription.status === "ativo"
                      ? "success"
                      : subscription.status === "atrasado"
                        ? "destructive"
                        : "secondary"
                  }
                >
                  {subscription.status}
                </Badge>
              )}
            </div>
            {subscription?.billing_type && (
              <p className="text-xs text-muted-foreground">
                Cobrança automática via{" "}
                {subscription.billing_type === "CREDIT_CARD" ? "cartão de crédito" : "Pix"} — Asaas
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm">
                <Link
                  to="/checkout"
                  search={{
                    plan: plans.find((p) => p.id !== subscription?.plan_id)?.id ?? "anual",
                  }}
                >
                  <CreditCard className="mr-1.5 h-3.5 w-3.5" /> Trocar de plano
                </Link>
              </Button>
              {subscription?.status !== "cancelado" && (
                <Button variant="ghost" size="sm" onClick={() => setConfirm(true)}>
                  Cancelar assinatura
                </Button>
              )}
              {subscription?.asaas_subscription_id && (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={syncMutation.isPending}
                  onClick={() => syncMutation.mutate()}
                >
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Sincronizar
                </Button>
              )}
            </div>
          </Card>

          <Card className="overflow-x-auto p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Forma</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>{dateBR(t.date)}</TableCell>
                    <TableCell>{brl(Number(t.amount))}</TableCell>
                    <TableCell className="capitalize">{t.method}</TableCell>
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
        </TabsContent>
      </Tabs>

      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar sua assinatura?</AlertDialogTitle>
            <AlertDialogDescription>
              Você mantém o acesso até o fim do período já pago. Pode reativar quando quiser.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={() => cancelMutation.mutate()}>
              Confirmar cancelamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
