import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("transactions", (table) => {
    table.uuid("id").primary();
    table.uuid("user_id").notNullable().references("id").inTable("users").onDelete("CASCADE");
    table.uuid("plan_id").notNullable().references("id").inTable("plans");
    table.decimal("amount", 10, 2).notNullable();
    table.enu("status", ["aprovado", "recusado", "pendente"]).notNullable();
    table.enu("method", ["cartao", "pix", "boleto"]).notNullable();
    table.timestamp("date").notNullable();
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("transactions");
}
