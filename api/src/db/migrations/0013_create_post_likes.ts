import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("post_likes", (table) => {
    table.uuid("id").primary();
    table.uuid("post_id").notNullable().references("id").inTable("posts").onDelete("CASCADE");
    table.uuid("user_id").notNullable().references("id").inTable("users").onDelete("CASCADE");
    table.timestamps(true, true);
    table.unique(["post_id", "user_id"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("post_likes");
}
