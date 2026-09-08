import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("lp_content", (table) => {
    table.uuid("id").primary();
    table
      .enu("section_key", ["hero", "beneficios", "depoimentos", "planos", "faq", "footer"])
      .notNullable()
      .unique();
    table.json("content").notNullable();
    table.integer("order").notNullable().defaultTo(0);
    table.boolean("active").notNullable().defaultTo(true);
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("lp_content");
}
