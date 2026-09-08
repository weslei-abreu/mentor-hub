import type { Knex } from "knex";
import { tagIds } from "../seedIds.js";

export async function seed(knex: Knex): Promise<void> {
  await knex("tags").insert([
    { id: tagIds.financeiro, name: "Financeiro" },
    { id: tagIds.rh, name: "RH & Pessoas" },
    { id: tagIds.marketing, name: "Marketing" },
    { id: tagIds.processos, name: "Processos" },
    { id: tagIds.vendas, name: "Vendas" },
    { id: tagIds.lideranca, name: "Liderança" },
  ]);
}
