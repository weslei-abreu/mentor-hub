import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("subscriptions", (table) => {
    table.uuid("id").primary();
    table.uuid("user_id").notNullable().references("id").inTable("users").onDelete("CASCADE");
    table.uuid("plan_id").notNullable().references("id").inTable("plans");
    table.enu("status", ["ativo", "atrasado", "cancelado"]).notNullable().defaultTo("ativo");
    table.timestamp("started_at").notNullable();
    table.timestamp("next_charge").nullable();
    table.decimal("amount", 10, 2).notNullable();
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("subscriptions");
}
