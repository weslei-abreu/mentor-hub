import { apiFetch } from "@/lib/api";
import type { Paginated, Subscription, Transaction } from "@/types";

export function mySubscription() {
  return apiFetch<Subscription | null>("/finance/subscriptions/me");
}

export function myTransactions() {
  return apiFetch<Transaction[]>("/finance/transactions/me");
}

export interface SubscribeCardInput {
  holderName: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  ccv: string;
}

export interface SubscribeHolderInput {
  cpfCnpj: string;
  postalCode: string;
  addressNumber: string;
  phone: string;
}

export function subscribe(input: {
  planId: string;
  card: SubscribeCardInput;
  holder: SubscribeHolderInput;
}) {
  return apiFetch<{ subscription: Subscription; transaction: Transaction }>(
    "/finance/subscriptions",
    { method: "POST", body: input },
  );
}

export function changePlan(planId: string) {
  return apiFetch<Subscription>("/finance/subscriptions/change-plan", {
    method: "POST",
    body: { planId },
  });
}

export function cancelSubscription() {
  return apiFetch<{ message: string }>("/finance/subscriptions/cancel", { method: "POST" });
}

export function syncMySubscription() {
  return apiFetch<{ message: string }>("/finance/subscriptions/sync", { method: "POST" });
}

export function syncSubscription(id: string) {
  return apiFetch<{ message: string }>(`/finance/subscriptions/${id}/sync`, { method: "POST" });
}

export interface TransactionListParams {
  status?: string;
  method?: string;
  planId?: string;
  from?: string;
  to?: string;
  page?: number;
  perPage?: number;
  [key: string]: string | number | boolean | undefined;
}

export function listTransactions(params: TransactionListParams = {}) {
  return apiFetch<Paginated<Transaction>>("/finance/transactions", { params });
}

export interface FinanceSummary {
  mrr: number;
  activeCount: number;
  lateCount: number;
  canceledCount: number;
  byPlan: Array<{ plan: string; count: number; amount: number }>;
  late: Array<Subscription & { user_name: string }>;
  recent: Transaction[];
  revenueSeries: Array<{ label: string; receita: number; novos: number }>;
}

export function financeSummary() {
  return apiFetch<FinanceSummary>("/finance/summary");
}
