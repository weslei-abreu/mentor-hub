import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("videos", (table) => {
    table.enu("source", ["youtube", "upload"]).nullable();
    table.string("youtube_id").nullable();
    table.string("youtube_url").nullable();
    table.string("file_url").nullable();
    table.string("thumbnail_url").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("videos", (table) => {
    table.dropColumn("source");
    table.dropColumn("youtube_id");
    table.dropColumn("youtube_url");
    table.dropColumn("file_url");
    table.dropColumn("thumbnail_url");
  });
}
