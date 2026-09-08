import { HttpError } from "../middlewares/errorHandler.js";

const BASE_URL = process.env.ASAAS_BASE_URL ?? "https://api-sandbox.asaas.com/v3";

interface AsaasErrorBody {
  errors?: Array<{ code: string; description: string }>;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      access_token: process.env.ASAAS_API_KEY ?? "",
      ...options.headers,
    },
  });

  const body = await res.json().catch(() => undefined);

  if (!res.ok) {
    const message =
      (body as AsaasErrorBody)?.errors?.map((e) => e.description).join(" ") ??
      "Falha na comunicação com o Asaas.";
    throw new HttpError(res.status === 400 ? 422 : 502, message);
  }

  return body as T;
}

export interface AsaasCustomer {
  id: string;
  name: string;
  email: string;
  cpfCnpj: string;
}

export function createCustomer(payload: {
  name: string;
  email: string;
  cpfCnpj: string;
  phone?: string;
  externalReference?: string;
}) {
  return request<AsaasCustomer>("/customers", { method: "POST", body: JSON.stringify(payload) });
}

export interface AsaasCreditCard {
  holderName: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  ccv: string;
}

export interface AsaasCreditCardHolderInfo {
  name: string;
  email: string;
  cpfCnpj: string;
  postalCode: string;
  addressNumber: string;
  addressComplement?: string;
  phone: string;
}

export interface AsaasSubscription {
  id: string;
  customer: string;
  status: "ACTIVE" | "EXPIRED" | "INACTIVE";
  nextDueDate: string;
  value: number;
  cycle: string;
  billingType: string;
}

export function createSubscription(payload: {
  customer: string;
  billingType: "CREDIT_CARD" | "PIX" | "BOLETO";
  value: number;
  nextDueDate: string;
  cycle: "MONTHLY" | "QUARTERLY" | "YEARLY";
  description: string;
  creditCard?: AsaasCreditCard;
  creditCardHolderInfo?: AsaasCreditCardHolderInfo;
  remoteIp?: string;
}) {
  return request<AsaasSubscription>("/subscriptions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getSubscription(id: string) {
  return request<AsaasSubscription>(`/subscriptions/${id}`);
}

export function updateSubscription(
  id: string,
  payload: { value: number; cycle: "MONTHLY" | "QUARTERLY" | "YEARLY"; description: string },
) {
  return request<AsaasSubscription>(`/subscriptions/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function cancelSubscription(id: string) {
  return request<{ deleted: boolean }>(`/subscriptions/${id}`, { method: "DELETE" });
}

export interface AsaasPayment {
  id: string;
  subscription?: string;
  customer: string;
  status: string;
  value: number;
  billingType: string;
  dueDate: string;
  paymentDate?: string;
  invoiceUrl: string;
  bankSlipUrl?: string;
}

export function listSubscriptionPayments(subscriptionId: string) {
  return request<{ data: AsaasPayment[] }>(
    `/payments?subscription=${subscriptionId}&sort=dateCreated&order=desc&limit=10`,
  );
}

export function getPayment(id: string) {
  return request<AsaasPayment>(`/payments/${id}`);
}
