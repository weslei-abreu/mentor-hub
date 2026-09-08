import type { Knex } from "knex";

// Substitui o nível único (none/view/edit) por 4 capacidades independentes,
// já que na prática um staff pode precisar, por exemplo, editar sem poder
// excluir. "Todos" na UI é só um atalho que liga as 4 de uma vez — não é um
// nível novo no banco.
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("staff_permissions", (table) => {
    table.boolean("can_view").notNullable().defaultTo(false);
    table.boolean("can_create").notNullable().defaultTo(false);
    table.boolean("can_edit").notNullable().defaultTo(false);
    table.boolean("can_delete").notNullable().defaultTo(false);
  });

  await knex("staff_permissions").where({ access_level: "view" }).update({ can_view: true });
  await knex("staff_permissions")
    .where({ access_level: "edit" })
    .update({ can_view: true, can_create: true, can_edit: true, can_delete: true });

  await knex.schema.alterTable("staff_permissions", (table) => {
    table.dropColumn("access_level");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("staff_permissions", (table) => {
    table.enu("access_level", ["none", "view", "edit"]).notNullable().defaultTo("none");
  });

  await knex("staff_permissions").where({ can_edit: true }).update({ access_level: "edit" });
  await knex("staff_permissions")
    .whereNot({ can_edit: true })
    .andWhere({ can_view: true })
    .update({ access_level: "view" });

  await knex.schema.alterTable("staff_permissions", (table) => {
    table.dropColumn("can_view");
    table.dropColumn("can_create");
    table.dropColumn("can_edit");
    table.dropColumn("can_delete");
  });
}
