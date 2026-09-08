import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  CreditCard,
  Loader2,
  Lock,
  RefreshCw,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { listPlans } from "@/services/planService";
import {
  changePlan,
  mySubscription,
  myTransactions,
  subscribe,
  syncMySubscription,
} from "@/services/financeService";
import { ApiError } from "@/lib/api";
import { isValidCpf } from "@/lib/cpf";
import { brl } from "@/lib/format";
import { useAuth } from "@/store/auth";
import { cn } from "@/lib/utils";
import { BRAND } from "@/types";

export const Route = createFileRoute("/checkout")({
  validateSearch: (search: Record<string, unknown>) => ({
    plan: typeof search["plan"] === "string" ? search["plan"] : "trimestral",
  }),
  component: Checkout,
});

const onlyDigits = (v: string) => v.replace(/\D/g, "");

interface HolderForm {
  cpf: string;
  cep: string;
  addressNumber: string;
  phone: string;
}

interface CardForm {
  number: string;
  name: string;
  expiry: string;
  cvv: string;
}

function Checkout() {
  const { plan: planParam } = Route.useSearch();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: plans = [] } = useQuery({ queryKey: ["plans"], queryFn: () => listPlans() });
  const { data: currentSubscription } = useQuery({
    queryKey: ["my-subscription"],
    queryFn: mySubscription,
    enabled: !!user,
  });

  const [planId, setPlanId] = useState(planParam);
  const [step, setStep] = useState<"plano" | "pagamento" | "aguardando" | "sucesso">("plano");
  const [loading, setLoading] = useState(false);
  const [usedSavedCard, setUsedSavedCard] = useState(false);
  const [useNewCard, setUseNewCard] = useState(false);
  const [holder, setHolder] = useState<HolderForm>({
    cpf: "",
    cep: "",
    addressNumber: "",
    phone: "",
  });
  const [card, setCard] = useState<CardForm>({ number: "", name: "", expiry: "", cvv: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const plan = plans.find((p) => p.id === planId) ?? plans[0];
  const canReuseCard =
    currentSubscription?.billing_type === "CREDIT_CARD" &&
    (currentSubscription.status === "ativo" || currentSubscription.status === "atrasado");
  const showSavedCard = canReuseCard && !useNewCard;

  const changePlanMutation = useMutation({ mutationFn: (id: string) => changePlan(id) });

  async function confirmSavedCard() {
    if (!plan) return;
    setFormError("");
    try {
      await changePlanMutation.mutateAsync(plan.id);
      setUsedSavedCard(true);
      setStep("sucesso");
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : "Não foi possível confirmar a troca de plano.",
      );
    }
  }

  function setHolderField(field: keyof HolderForm, value: string) {
    setHolder((h) => ({ ...h, [field]: value }));
    setErrors((e) => ({ ...e, [field]: "" }));
  }

  function setCardField(field: keyof CardForm, value: string) {
    setCard((c) => ({ ...c, [field]: value }));
    setErrors((e) => ({ ...e, [field]: "" }));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!isValidCpf(holder.cpf)) e["cpf"] = "CPF inválido";
    if (onlyDigits(holder.cep).length !== 8) e["cep"] = "CEP deve ter 8 dígitos";
    if (holder.addressNumber.trim().length === 0) e["addressNumber"] = "Informe o número";
    if (onlyDigits(holder.phone).length < 10) e["phone"] = "Telefone inválido";

    if (onlyDigits(card.number).length < 13) e["number"] = "Número do cartão inválido";
    if (card.name.trim().length < 5) e["name"] = "Informe o nome impresso no cartão";
    if (!/^\d{2}\/\d{2,4}$/.test(card.expiry)) e["expiry"] = "Use o formato MM/AA";
    if (onlyDigits(card.cvv).length < 3) e["cvv"] = "CVV inválido";

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  useEffect(() => stopPolling, []);

  async function checkPaymentStatus() {
    if (!transactionId) return;
    await syncMySubscription().catch(() => undefined);
    const transactions = await myTransactions();
    const current = transactions.find((t) => t.id === transactionId);
    if (current?.status === "aprovado") {
      stopPolling();
      setStep("sucesso");
    } else if (current?.status === "recusado") {
      stopPolling();
      setFormError("O pagamento não foi aprovado. Tente novamente com outro método.");
      setStep("pagamento");
    }
  }

  function startPolling() {
    stopPolling();
    pollRef.current = setInterval(() => {
      void checkPaymentStatus();
    }, 4000);
  }

  async function pay() {
    if (!plan) return;
    setFormError("");
    if (!validate()) return;

    setLoading(true);
    try {
      const expiryDigits = onlyDigits(card.expiry);
      const expiryMonth = expiryDigits.slice(0, 2);
      const expiryYear =
        expiryDigits.length === 4 ? `20${expiryDigits.slice(2, 4)}` : expiryDigits.slice(2, 6);

      const result = await subscribe({
        planId: plan.id,
        card: {
          holderName: card.name.trim(),
          number: onlyDigits(card.number),
          expiryMonth,
          expiryYear,
          ccv: onlyDigits(card.cvv),
        },
        holder: {
          cpfCnpj: onlyDigits(holder.cpf),
          postalCode: onlyDigits(holder.cep),
          addressNumber: holder.addressNumber.trim(),
          phone: onlyDigits(holder.phone),
        },
      });

      setTransactionId(result.transaction.id);

      if (result.transaction.status === "aprovado") {
        setStep("sucesso");
        return;
      }

      setStep("aguardando");
      startPolling();
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : "Não foi possível processar o pagamento.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
        <Card className="max-w-sm gap-4 p-8 text-center">
          <p className="font-display text-lg font-semibold">Entre na sua conta</p>
          <p className="text-sm text-muted-foreground">
            Você precisa estar logado para assinar um plano.
          </p>
          <Button asChild className="w-full">
            <Link to="/login">Ir para o login</Link>
          </Button>
        </Card>
      </div>
    );
  }

  if (!plan) return null;

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <Link
            to={user ? "/aluno/perfil" : "/"}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
          <span className="font-display text-sm font-semibold">{BRAND.name}</span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5" /> Pagamento seguro via Asaas
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-5 sm:py-10">
        <div className="mb-8 flex flex-wrap items-center gap-y-2 text-[11px] sm:gap-2 sm:text-xs">
          {(["plano", "pagamento", "sucesso"] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-1.5 sm:gap-2">
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-medium",
                  step === s || (s === "pagamento" && step === "aguardando")
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground",
                )}
              >
                {i + 1}
              </span>
              <span
                className={cn("capitalize", step === s ? "font-medium" : "text-muted-foreground")}
              >
                {s}
              </span>
              {i < 2 && <span className="mx-1.5 h-px w-4 bg-border sm:mx-2 sm:w-8" />}
            </div>
          ))}
        </div>

        {step === "sucesso" ? (
          <Card className="mx-auto max-w-lg items-center gap-4 p-6 text-center sm:p-10">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/15">
              <Check className="h-7 w-7 text-success" />
            </div>
            <h1 className="font-display text-2xl font-semibold">
              {usedSavedCard ? "Plano atualizado!" : "Pagamento aprovado!"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {usedSavedCard ? (
                <>
                  Sua assinatura agora é o plano <strong>{plan.name}</strong> (
                  {brl(Number(plan.price))}), cobrado no cartão já cadastrado.
                </>
              ) : (
                <>
                  Sua assinatura do plano <strong>{plan.name}</strong> ({brl(Number(plan.price))})
                  está ativa. Bem-vindo ao {BRAND.name}.
                </>
              )}
            </p>
            <Button size="lg" className="mt-2 w-full" onClick={() => navigate({ to: "/aluno" })}>
              Ir para minha área de aluno
            </Button>
          </Card>
        ) : step === "aguardando" ? (
          <Card className="mx-auto max-w-lg items-center gap-4 p-6 text-center sm:p-10">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-warning/15">
              <Loader2 className="h-7 w-7 animate-spin text-warning" />
            </div>
            <p className="text-sm font-medium">Aguardando confirmação do pagamento…</p>
            <p className="text-xs text-muted-foreground">
              Assim que recebermos a confirmação do Asaas, sua assinatura é ativada automaticamente.
            </p>
            <Button variant="outline" size="sm" onClick={() => void checkPaymentStatus()}>
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Já paguei, verificar agora
            </Button>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div>
              {step === "plano" && (
                <Card className="gap-5 p-6">
                  <div>
                    <h1 className="font-display text-xl font-semibold">Confirme seu plano</h1>
                    <p className="text-sm text-muted-foreground">
                      Você pode trocar de plano depois, sem custo.
                    </p>
                  </div>
                  <div className="space-y-3">
                    {plans.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setPlanId(p.id)}
                        className={cn(
                          "flex w-full items-center justify-between rounded-xl border p-4 text-left transition-colors",
                          planId === p.id
                            ? "border-primary bg-accent/40"
                            : "border-border hover:border-primary/40",
                        )}
                      >
                        <div>
                          <p className="flex items-center gap-2 font-medium">
                            {p.name}
                            {p.highlight && <Badge className="text-[10px]">Mais popular</Badge>}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {brl(Number(p.monthly_equivalent))} por mês · {p.features.length}{" "}
                            benefícios
                          </p>
                        </div>
                        <span className="font-display text-lg font-semibold">
                          {brl(Number(p.price))}
                        </span>
                      </button>
                    ))}
                  </div>
                  {canReuseCard && (
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Wallet className="h-3.5 w-3.5" /> Você já tem um cartão cadastrado. Você
                      poderá reaproveitá-lo na próxima etapa.
                    </p>
                  )}
                  <Button size="lg" onClick={() => setStep("pagamento")}>
                    Continuar para o pagamento
                  </Button>
                </Card>
              )}

              {step === "pagamento" && (
                <Card className="gap-5 p-6">
                  <div>
                    <h1 className="font-display text-xl font-semibold">Pagamento</h1>
                    <p className="text-sm text-muted-foreground">
                      Cobrança recorrente processada pelo Asaas —{" "}
                      {plan.period.replace("/", "a cada ")}.
                    </p>
                  </div>

                  {showSavedCard ? (
                    <>
                      <div className="space-y-3 rounded-lg border border-border p-4">
                        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          <Wallet className="h-3.5 w-3.5" /> Cartão salvo
                        </p>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <CreditCard className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">
                                {currentSubscription?.card_brand ?? "Cartão"} ••••{" "}
                                {currentSubscription?.card_last4}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Usado na sua assinatura atual
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setUseNewCard(true)}
                            className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                          >
                            Usar outro cartão
                          </button>
                        </div>
                      </div>
                      {formError && <p className="text-xs text-destructive">{formError}</p>}
                      <Button
                        size="lg"
                        className="w-full"
                        disabled={changePlanMutation.isPending}
                        onClick={() => void confirmSavedCard()}
                      >
                        {changePlanMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Confirmando…
                          </>
                        ) : (
                          <>Confirmar plano {plan.name}</>
                        )}
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="space-y-4 rounded-lg border border-border p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Seus dados
                        </p>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-1.5">
                            <Label htmlFor="cpf">CPF</Label>
                            <Input
                              id="cpf"
                              inputMode="numeric"
                              placeholder="000.000.000-00"
                              value={holder.cpf}
                              onChange={(e) =>
                                setHolderField(
                                  "cpf",
                                  onlyDigits(e.target.value)
                                    .slice(0, 11)
                                    .replace(/(\d{3})(\d)/, "$1.$2")
                                    .replace(/(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
                                    .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4"),
                                )
                              }
                            />
                            {errors["cpf"] && (
                              <p className="text-xs text-destructive">{errors["cpf"]}</p>
                            )}
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="phone">Telefone</Label>
                            <Input
                              id="phone"
                              inputMode="numeric"
                              placeholder="(00) 00000-0000"
                              value={holder.phone}
                              onChange={(e) =>
                                setHolderField("phone", onlyDigits(e.target.value).slice(0, 11))
                              }
                            />
                            {errors["phone"] && (
                              <p className="text-xs text-destructive">{errors["phone"]}</p>
                            )}
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="cep">CEP</Label>
                            <Input
                              id="cep"
                              inputMode="numeric"
                              placeholder="00000-000"
                              value={holder.cep}
                              onChange={(e) =>
                                setHolderField(
                                  "cep",
                                  onlyDigits(e.target.value)
                                    .slice(0, 8)
                                    .replace(/(\d{5})(\d)/, "$1-$2"),
                                )
                              }
                            />
                            {errors["cep"] && (
                              <p className="text-xs text-destructive">{errors["cep"]}</p>
                            )}
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="addressNumber">Número</Label>
                            <Input
                              id="addressNumber"
                              value={holder.addressNumber}
                              onChange={(e) => setHolderField("addressNumber", e.target.value)}
                            />
                            {errors["addressNumber"] && (
                              <p className="text-xs text-destructive">{errors["addressNumber"]}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4 rounded-lg border border-border p-4">
                        <div className="flex items-center justify-between gap-2">
                          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            <CreditCard className="h-3.5 w-3.5" /> Cartão de crédito
                          </p>
                          {canReuseCard && (
                            <button
                              type="button"
                              onClick={() => setUseNewCard(false)}
                              className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                            >
                              Usar cartão salvo
                            </button>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="number">Número do cartão</Label>
                          <Input
                            id="number"
                            inputMode="numeric"
                            placeholder="0000 0000 0000 0000"
                            autoComplete="cc-number"
                            value={card.number}
                            onChange={(e) =>
                              setCardField(
                                "number",
                                onlyDigits(e.target.value)
                                  .slice(0, 16)
                                  .replace(/(\d{4})(?=\d)/g, "$1 "),
                              )
                            }
                          />
                          {errors["number"] && (
                            <p className="text-xs text-destructive">{errors["number"]}</p>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="name">Nome impresso no cartão</Label>
                          <Input
                            id="name"
                            autoComplete="cc-name"
                            value={card.name}
                            onChange={(e) => setCardField("name", e.target.value.toUpperCase())}
                          />
                          {errors["name"] && (
                            <p className="text-xs text-destructive">{errors["name"]}</p>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label htmlFor="expiry">Validade</Label>
                            <Input
                              id="expiry"
                              placeholder="MM/AA"
                              autoComplete="cc-exp"
                              value={card.expiry}
                              onChange={(e) => {
                                const d = onlyDigits(e.target.value).slice(0, 4);
                                setCardField(
                                  "expiry",
                                  d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d,
                                );
                              }}
                            />
                            {errors["expiry"] && (
                              <p className="text-xs text-destructive">{errors["expiry"]}</p>
                            )}
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="cvv">CVV</Label>
                            <Input
                              id="cvv"
                              inputMode="numeric"
                              autoComplete="cc-csc"
                              value={card.cvv}
                              onChange={(e) =>
                                setCardField("cvv", onlyDigits(e.target.value).slice(0, 4))
                              }
                            />
                            {errors["cvv"] && (
                              <p className="text-xs text-destructive">{errors["cvv"]}</p>
                            )}
                          </div>
                        </div>
                        {formError && <p className="text-xs text-destructive">{formError}</p>}
                      </div>
                      <Button
                        size="lg"
                        className="w-full"
                        disabled={loading}
                        onClick={() => void pay()}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processando pagamento…
                          </>
                        ) : (
                          <>Pagar {brl(Number(plan.price))}</>
                        )}
                      </Button>
                    </>
                  )}
                </Card>
              )}
            </div>

            <aside className="space-y-4">
              <Card className="gap-3 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Resumo
                </p>
                <div className="flex items-center justify-between text-sm">
                  <span>Plano {plan.name}</span>
                  <span className="font-medium">{brl(Number(plan.price))}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Equivalente mensal</span>
                  <span>{brl(Number(plan.monthly_equivalent))}</span>
                </div>
                <div className="mt-2 border-t border-border pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total hoje</span>
                    <span className="font-display text-xl font-semibold">
                      {brl(Number(plan.price))}
                    </span>
                  </div>
                </div>
                <ul className="mt-2 space-y-1.5">
                  {plan.features.slice(0, 4).map((f) => (
                    <li key={f} className="flex gap-2 text-xs text-muted-foreground">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                      {f}
                    </li>
                  ))}
                </ul>
              </Card>
              <div className="flex items-start gap-2 rounded-lg border border-border bg-background p-4 text-xs text-muted-foreground">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                Pagamento processado pelo Asaas. Seus dados de cartão não são armazenados pelo Locus
                Club.
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
