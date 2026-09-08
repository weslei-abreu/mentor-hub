import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("teia_requests", (table) => {
    table.uuid("id").primary();
    table
      .uuid("contact_id")
      .notNullable()
      .references("id")
      .inTable("teia_contacts")
      .onDelete("CASCADE");
    table
      .uuid("requested_by_id")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table.enu("status", ["pendente", "aprovado", "recusado"]).notNullable().defaultTo("pendente");
    table.text("message").nullable();
    table.timestamp("responded_at").nullable();
    table.timestamps(true, true);
    table.unique(["contact_id", "requested_by_id"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("teia_requests");
}
