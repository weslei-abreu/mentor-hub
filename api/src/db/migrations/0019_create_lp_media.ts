import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("lp_media", (table) => {
    table.uuid("id").primary();
    table
      .enu("section_key", ["hero", "beneficios", "depoimentos", "planos", "faq", "footer"])
      .notNullable();
    table.string("url").notNullable();
    table.string("alt").nullable();
    table.integer("order").notNullable().defaultTo(0);
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("lp_media");
}
