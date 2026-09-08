import { v4 as uuid } from "uuid";
import type { Knex } from "knex";
import { clienteIds, planIds } from "../seedIds.js";

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const daysAgo = (d: number) => new Date(Date.now() - d * 86400000);
const daysAhead = (d: number) => new Date(Date.now() + d * 86400000);

const plans = [
  { id: planIds.mensal, amount: 197 },
  { id: planIds.trimestral, amount: 497 },
  { id: planIds.anual, amount: 1597 },
];

export async function seed(knex: Knex): Promise<void> {
  const r = rng(445566);
  const subscriptions: Array<Record<string, unknown>> = [];
  const transactions: Array<Record<string, unknown>> = [];

  clienteIds.forEach((userId, i) => {
    const plan = plans[i % plans.length]!;
    const roll = r();
    const status = roll < 0.68 ? "ativo" : roll < 0.86 ? "atrasado" : "cancelado";
    const startedAt = daysAgo(60 + i * 15);
    const subscriptionId = uuid();

    subscriptions.push({
      id: subscriptionId,
      user_id: userId,
      plan_id: plan.id,
      status,
      started_at: startedAt,
      next_charge: status === "cancelado" ? null : daysAhead(Math.floor(r() * 29) + 1),
      amount: plan.amount,
    });

    const count = Math.floor(r() * 4) + 1;
    for (let j = 0; j < count; j++) {
      const txRoll = r();
      const txStatus =
        status === "atrasado" && j === 0
          ? "recusado"
          : txRoll < 0.84
            ? "aprovado"
            : txRoll < 0.93
              ? "recusado"
              : "pendente";
      transactions.push({
        id: uuid(),
        user_id: userId,
        plan_id: plan.id,
        amount: plan.amount,
        status: txStatus,
        method: ["cartao", "pix", "boleto"][Math.floor(r() * 3)],
        date: daysAgo(j * 30 + Math.floor(r() * 8)),
      });
    }
  });

  await knex("subscriptions").insert(subscriptions);
  await knex("transactions").insert(transactions);
}
