import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("plans", (table) => {
    table.uuid("id").primary();
    table.string("name").notNullable();
    table.decimal("price", 10, 2).notNullable();
    table.string("period").notNullable();
    table.decimal("monthly_equivalent", 10, 2).notNullable();
    table.json("features").notNullable();
    table.boolean("highlight").notNullable().defaultTo(false);
    table.boolean("active").notNullable().defaultTo(true);
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("plans");
}
