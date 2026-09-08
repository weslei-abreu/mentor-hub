import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("video_tags", (table) => {
    table.uuid("video_id").notNullable().references("id").inTable("videos").onDelete("CASCADE");
    table.uuid("tag_id").notNullable().references("id").inTable("tags").onDelete("CASCADE");
    table.primary(["video_id", "tag_id"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("video_tags");
}
