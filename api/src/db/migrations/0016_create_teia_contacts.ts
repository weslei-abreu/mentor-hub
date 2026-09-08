import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("teia_contacts", (table) => {
    table.uuid("id").primary();
    table
      .uuid("registered_by_id")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table.uuid("linked_user_id").nullable().references("id").inTable("users").onDelete("SET NULL");
    table.string("name").notNullable();
    table.string("company_name").nullable();
    table.string("field").nullable();
    table.string("city").nullable();
    table.string("phone").nullable();
    table.string("email").nullable();
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("teia_contacts");
}
