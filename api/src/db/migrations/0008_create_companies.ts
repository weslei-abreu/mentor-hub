import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("companies", (table) => {
    table.uuid("id").primary();
    table.string("name").notNullable();
    table.string("logo").nullable();
    table.text("description").nullable();
    table.string("field").nullable();
    table.string("link").nullable();
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("companies");
}
