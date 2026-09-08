import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(
    "ALTER TABLE `users` MODIFY COLUMN `role` ENUM('admin', 'mentor', 'aluno', 'staff') NOT NULL DEFAULT 'aluno'",
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex("users").where({ role: "staff" }).del();
  await knex.raw(
    "ALTER TABLE `users` MODIFY COLUMN `role` ENUM('admin', 'mentor', 'aluno') NOT NULL DEFAULT 'aluno'",
  );
}
