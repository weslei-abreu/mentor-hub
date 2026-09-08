import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("users", (table) => {
    table.string("asaas_customer_id").nullable();
    table.string("cpf_cnpj").nullable();
    table.string("phone").nullable();
  });

  await knex.schema.alterTable("subscriptions", (table) => {
    table.string("asaas_subscription_id").nullable().unique();
    table.enu("billing_type", ["CREDIT_CARD", "PIX", "BOLETO"]).nullable();
  });

  await knex.schema.alterTable("transactions", (table) => {
    table.string("asaas_payment_id").nullable().unique();
    table.string("invoice_url").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("transactions", (table) => {
    table.dropColumn("asaas_payment_id");
    table.dropColumn("invoice_url");
  });
  await knex.schema.alterTable("subscriptions", (table) => {
    table.dropColumn("asaas_subscription_id");
    table.dropColumn("billing_type");
  });
  await knex.schema.alterTable("users", (table) => {
    table.dropColumn("asaas_customer_id");
    table.dropColumn("cpf_cnpj");
    table.dropColumn("phone");
  });
}
