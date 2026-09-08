import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("posts", (table) => {
    table.uuid("id").primary();
    table.uuid("user_id").notNullable().references("id").inTable("users").onDelete("CASCADE");
    table.text("text").notNullable();
    table.uuid("tag_id").nullable().references("id").inTable("tags").onDelete("SET NULL");
    table.uuid("video_id").nullable().references("id").inTable("videos").onDelete("SET NULL");
    table.integer("likes_count").notNullable().defaultTo(0);
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("posts");
}
