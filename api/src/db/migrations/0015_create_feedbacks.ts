import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("feedbacks", (table) => {
    table.uuid("id").primary();
    table.uuid("video_id").notNullable().references("id").inTable("videos").onDelete("CASCADE");
    table.uuid("user_id").notNullable().references("id").inTable("users").onDelete("CASCADE");
    table.integer("rating").notNullable();
    table.text("comment").nullable();
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("feedbacks");
}
