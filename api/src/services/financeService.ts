import { v4 as uuid } from "uuid";
import { db } from "../db/knex.js";
import { HttpError } from "../middlewares/errorHandler.js";
import * as asaas from "./asaasClient.js";

type PlanRow = {
  id: string;
  name: string;
  price: string | number;
  period: string;
};

type UserRow = {
  id: string;
  name: string;
  email: string;
  asaas_customer_id: string | null;
  cpf_cnpj: string | null;
  phone: string | null;
};

const CYCLE_BY_PLAN_ID: Record<string, "MONTHLY" | "QUARTERLY" | "YEARLY"> = {
  mensal: "MONTHLY",
  trimestral: "QUARTERLY",
  anual: "YEARLY",
};

function resolveCycle(plan: PlanRow): "MONTHLY" | "QUARTERLY" | "YEARLY" {
  if (CYCLE_BY_PLAN_ID[plan.id]) return CYCLE_BY_PLAN_ID[plan.id]!;
  if (plan.period.includes("trimestre")) return "QUARTERLY";
  if (plan.period.includes("ano")) return "YEARLY";
  return "MONTHLY";
}

export function mapAsaasPaymentStatus(status: string): "aprovado" | "recusado" | "pendente" {
  if (["CONFIRMED", "RECEIVED", "RECEIVED_IN_CASH"].includes(status)) return "aprovado";
  if (["PENDING", "AWAITING_RISK_ANALYSIS"].includes(status)) return "pendente";
  return "recusado";
}

export function mapBillingTypeToMethod(billingType: string): "cartao" | "pix" | "boleto" {
  if (billingType === "CREDIT_CARD") return "cartao";
  if (billingType === "PIX") return "pix";
  return "boleto";
}

// Detecção simples de bandeira a partir do BIN, só para exibição — não afeta a cobrança em si.
function detectCardBrand(number: string): string {
  if (/^4/.test(number)) return "Visa";
  if (/^(5[1-5]|2[2-7])/.test(number)) return "Mastercard";
  if (/^3[47]/.test(number)) return "American Express";
  if (/^(636368|438935|504175|451416|509\d{3}|636297|5067|4576|4011)/.test(number)) return "Elo";
  if (/^606282/.test(number)) return "Hipercard";
  return "Cartão";
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

async function ensureAsaasCustomer(
  user: UserRow,
  holder: { cpfCnpj: string; phone?: string },
): Promise<string> {
  if (user.asaas_customer_id) return user.asaas_customer_id;

  const customer = await asaas.createCustomer({
    name: user.name,
    email: user.email,
    cpfCnpj: holder.cpfCnpj,
    phone: holder.phone,
    externalReference: user.id,
  });

  await db("users")
    .where({ id: user.id })
    .update({
      asaas_customer_id: customer.id,
      cpf_cnpj: holder.cpfCnpj,
      phone: holder.phone ?? null,
    });

  return customer.id;
}

export interface SubscribeInput {
  userId: string;
  planId: string;
  remoteIp?: string;
  card: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
  };
  holder: {
    cpfCnpj: string;
    postalCode: string;
    addressNumber: string;
    phone: string;
  };
}

export async function subscribe(input: SubscribeInput) {
  const plan = await db<PlanRow>("plans").where({ id: input.planId }).first();
  if (!plan) throw new HttpError(404, "Plano não encontrado.");

  const user = await db<UserRow>("users").where({ id: input.userId }).first();
  if (!user) throw new HttpError(404, "Usuário não encontrado.");

  const asaasCustomerId = await ensureAsaasCustomer(user, {
    cpfCnpj: input.holder.cpfCnpj,
    phone: input.holder.phone,
  });

  const billingType = "CREDIT_CARD";
  const value = Number(plan.price);

  const existingSubscription = await db("subscriptions")
    .where({ user_id: input.userId })
    .orderBy("created_at", "desc")
    .first();

  if (existingSubscription?.asaas_subscription_id) {
    await asaas
      .cancelSubscription(existingSubscription.asaas_subscription_id)
      .catch(() => undefined);
  }

  const asaasSubscription = await asaas.createSubscription({
    customer: asaasCustomerId,
    billingType,
    value,
    nextDueDate: todayISO(),
    cycle: resolveCycle(plan),
    description: `Locus Club — plano ${plan.name}`,
    remoteIp: input.remoteIp,
    creditCard: {
      holderName: input.card.holderName,
      number: input.card.number,
      expiryMonth: input.card.expiryMonth,
      expiryYear: input.card.expiryYear,
      ccv: input.card.ccv,
    },
    creditCardHolderInfo: {
      name: input.card.holderName,
      email: user.email,
      cpfCnpj: input.holder.cpfCnpj,
      postalCode: input.holder.postalCode,
      addressNumber: input.holder.addressNumber,
      phone: input.holder.phone,
    },
  });

  const { data: payments } = await asaas.listSubscriptionPayments(asaasSubscription.id);
  const firstPayment = payments[0];
  if (!firstPayment)
    throw new HttpError(502, "Assinatura criada, mas nenhuma cobrança foi gerada.");

  const now = new Date();
  const subscriptionPayload = {
    user_id: input.userId,
    plan_id: plan.id,
    status: "ativo",
    started_at: now,
    next_charge: asaasSubscription.nextDueDate,
    amount: value,
    asaas_subscription_id: asaasSubscription.id,
    billing_type: billingType,
    card_last4: input.card.number.slice(-4),
    card_brand: detectCardBrand(input.card.number),
  };

  let subscriptionId: string;
  if (existingSubscription) {
    subscriptionId = existingSubscription.id;
    await db("subscriptions").where({ id: existingSubscription.id }).update(subscriptionPayload);
  } else {
    subscriptionId = uuid();
    await db("subscriptions").insert({ id: subscriptionId, ...subscriptionPayload });
  }

  const transactionId = uuid();
  await db("transactions").insert({
    id: transactionId,
    user_id: input.userId,
    plan_id: plan.id,
    amount: value,
    status: mapAsaasPaymentStatus(firstPayment.status),
    method: "cartao",
    date: firstPayment.paymentDate ?? firstPayment.dueDate,
    asaas_payment_id: firstPayment.id,
    invoice_url: firstPayment.invoiceUrl,
  });

  const subscription = await db("subscriptions").where({ id: subscriptionId }).first();
  const transaction = await db("transactions").where({ id: transactionId }).first();
  return { subscription, transaction };
}

export async function changePlan(userId: string, planId: string) {
  const plan = await db<PlanRow>("plans").where({ id: planId }).first();
  if (!plan) throw new HttpError(404, "Plano não encontrado.");

  const subscription = await db("subscriptions")
    .where({ user_id: userId })
    .orderBy("created_at", "desc")
    .first();

  if (
    !subscription?.asaas_subscription_id ||
    subscription.billing_type !== "CREDIT_CARD" ||
    !["ativo", "atrasado"].includes(subscription.status)
  ) {
    throw new HttpError(
      422,
      "Não há um cartão salvo para essa assinatura. Refaça o checkout informando os dados do cartão.",
    );
  }

  const value = Number(plan.price);
  const updated = await asaas.updateSubscription(subscription.asaas_subscription_id, {
    value,
    cycle: resolveCycle(plan),
    description: `Locus Club — plano ${plan.name}`,
  });

  await db("subscriptions").where({ id: subscription.id }).update({
    plan_id: plan.id,
    amount: value,
    next_charge: updated.nextDueDate,
  });

  return db("subscriptions").where({ id: subscription.id }).first();
}

export async function cancelSubscription(userId: string) {
  const subscription = await db("subscriptions")
    .where({ user_id: userId })
    .orderBy("created_at", "desc")
    .first();
  if (!subscription) throw new HttpError(404, "Assinatura não encontrada.");

  if (subscription.asaas_subscription_id) {
    await asaas.cancelSubscription(subscription.asaas_subscription_id).catch(() => undefined);
  }

  await db("subscriptions")
    .where({ id: subscription.id })
    .update({ status: "cancelado", next_charge: null });
}

async function upsertTransactionFromPayment(payment: asaas.AsaasPayment) {
  const existing = await db("transactions").where({ asaas_payment_id: payment.id }).first();
  const status = mapAsaasPaymentStatus(payment.status);

  if (existing) {
    await db("transactions")
      .where({ id: existing.id })
      .update({
        status,
        invoice_url: payment.invoiceUrl,
        date: payment.paymentDate ?? payment.dueDate,
      });
    return existing.id;
  }

  if (!payment.subscription) return null;
  const subscription = await db("subscriptions")
    .where({ asaas_subscription_id: payment.subscription })
    .first();
  if (!subscription) return null;

  const id = uuid();
  await db("transactions").insert({
    id,
    user_id: subscription.user_id,
    plan_id: subscription.plan_id,
    amount: payment.value,
    status,
    method: mapBillingTypeToMethod(payment.billingType),
    date: payment.paymentDate ?? payment.dueDate,
    asaas_payment_id: payment.id,
    invoice_url: payment.invoiceUrl,
  });
  return id;
}

export async function reconcileSubscription(subscriptionId: string) {
  const subscription = await db("subscriptions").where({ id: subscriptionId }).first();
  if (!subscription?.asaas_subscription_id) return;

  const [asaasSubscription, { data: payments }] = await Promise.all([
    asaas.getSubscription(subscription.asaas_subscription_id).catch(() => null),
    asaas.listSubscriptionPayments(subscription.asaas_subscription_id).catch(() => ({ data: [] })),
  ]);

  for (const payment of payments) {
    await upsertTransactionFromPayment(payment);
  }

  if (!asaasSubscription) return;

  const latestStatus = payments[0] ? mapAsaasPaymentStatus(payments[0].status) : null;
  const nextStatus =
    subscription.status === "cancelado"
      ? "cancelado"
      : latestStatus === "recusado"
        ? "atrasado"
        : "ativo";

  await db("subscriptions")
    .where({ id: subscriptionId })
    .update({ status: nextStatus, next_charge: asaasSubscription.nextDueDate });
}

export async function reconcileUserSubscription(userId: string) {
  const subscription = await db("subscriptions")
    .where({ user_id: userId })
    .whereNotNull("asaas_subscription_id")
    .orderBy("created_at", "desc")
    .first();
  if (subscription) await reconcileSubscription(subscription.id);
}

export async function handleWebhookPayment(payment: asaas.AsaasPayment) {
  await upsertTransactionFromPayment(payment);
  if (!payment.subscription) return;

  const subscription = await db("subscriptions")
    .where({ asaas_subscription_id: payment.subscription })
    .first();
  if (!subscription) return;

  const status = mapAsaasPaymentStatus(payment.status);
  const nextStatus = status === "recusado" ? "atrasado" : "ativo";
  await db("subscriptions").where({ id: subscription.id }).update({ status: nextStatus });
}

export async function handleWebhookSubscriptionCanceled(asaasSubscriptionId: string) {
  await db("subscriptions")
    .where({ asaas_subscription_id: asaasSubscriptionId })
    .update({ status: "cancelado", next_charge: null });
}
