import { Router } from "express";
import {
  handleWebhookPayment,
  handleWebhookSubscriptionCanceled,
} from "../services/financeService.js";

export const webhooksRouter = Router();

const PAYMENT_EVENTS = new Set([
  "PAYMENT_CREATED",
  "PAYMENT_UPDATED",
  "PAYMENT_CONFIRMED",
  "PAYMENT_RECEIVED",
  "PAYMENT_OVERDUE",
  "PAYMENT_REFUNDED",
  "PAYMENT_DELETED",
]);

webhooksRouter.post("/asaas", async (req, res) => {
  const token = req.headers["asaas-access-token"];
  if (token !== process.env.ASAAS_WEBHOOK_TOKEN) {
    return res.status(401).json({ message: "Token de webhook inválido." });
  }

  try {
    const { event, payment, subscription } = req.body as {
      event?: string;
      payment?: Parameters<typeof handleWebhookPayment>[0];
      subscription?: { id: string };
    };

    if (event && PAYMENT_EVENTS.has(event) && payment) {
      await handleWebhookPayment(payment);
    } else if (event === "SUBSCRIPTION_DELETED" && subscription) {
      await handleWebhookSubscriptionCanceled(subscription.id);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Erro ao processar webhook do Asaas:", error);
    res.status(200).json({ received: true });
  }
});
