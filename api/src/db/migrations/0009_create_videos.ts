import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("videos", (table) => {
    table.uuid("id").primary();
    table.string("title").notNullable();
    table.text("description").nullable();
    table.integer("duration").notNullable();
    table.timestamp("published_at").notNullable();
    table.uuid("company_id").nullable().references("id").inTable("companies").onDelete("SET NULL");
    table.integer("views").notNullable().defaultTo(0);
    table.decimal("rating", 3, 1).notNullable().defaultTo(0);
    table.integer("ratings_count").notNullable().defaultTo(0);
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("videos");
}
