import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("video_progress", (table) => {
    table.uuid("id").primary();
    table.uuid("user_id").notNullable().references("id").inTable("users").onDelete("CASCADE");
    table.uuid("video_id").notNullable().references("id").inTable("videos").onDelete("CASCADE");
    table.integer("progress").notNullable().defaultTo(0);
    table.timestamp("watched_at").notNullable();
    table.timestamps(true, true);
    table.unique(["user_id", "video_id"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("video_progress");
}
