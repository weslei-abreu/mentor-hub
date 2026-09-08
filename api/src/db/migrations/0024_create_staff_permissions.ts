import type { Knex } from "knex";

export const STAFF_MODULES = [
  "dashboard",
  "alunos",
  "conteudo",
  "comunidade",
  "financeiro",
  "teia",
  "usuarios",
  "lp",
  "staff",
];

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("staff_permissions", (table) => {
    table.uuid("id").primary();
    table.uuid("user_id").notNullable().references("id").inTable("users").onDelete("CASCADE");
    table.enu("module", STAFF_MODULES).notNullable();
    table.enu("access_level", ["none", "view", "edit"]).notNullable().defaultTo("none");
    table.timestamps(true, true);
    table.unique(["user_id", "module"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("staff_permissions");
}
