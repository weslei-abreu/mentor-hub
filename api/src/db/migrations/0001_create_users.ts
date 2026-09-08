import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("users", (table) => {
    table.uuid("id").primary();
    table.string("name").notNullable();
    table.string("email").notNullable().unique();
    table.string("password_hash").notNullable();
    table.enu("role", ["admin", "mentor", "aluno"]).notNullable().defaultTo("aluno");
    table.string("business").nullable();
    table.string("avatar").nullable();
    table.enu("status", ["ativo", "inativo"]).notNullable().defaultTo("ativo");
    table.timestamp("last_access").nullable();
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("users");
}
