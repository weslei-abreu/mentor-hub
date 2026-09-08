import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("subscriptions", (table) => {
    table.string("card_last4", 4).nullable();
    table.string("card_brand").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("subscriptions", (table) => {
    table.dropColumn("card_last4");
    table.dropColumn("card_brand");
  });
}
