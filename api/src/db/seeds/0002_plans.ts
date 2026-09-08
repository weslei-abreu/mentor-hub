import type { Knex } from "knex";
import { planIds } from "../seedIds.js";

export async function seed(knex: Knex): Promise<void> {
  await knex("plans").insert([
    {
      id: planIds.mensal,
      name: "Mensal",
      price: 197,
      period: "/mês",
      monthly_equivalent: 197,
      features: JSON.stringify([
        "Acesso a toda a biblioteca de aulas",
        "Comunidade de donos de negócio",
        "Novos conteúdos toda semana",
        "Cancele quando quiser",
      ]),
      highlight: false,
      active: true,
    },
    {
      id: planIds.trimestral,
      name: "Trimestral",
      price: 497,
      period: "/trimestre",
      monthly_equivalent: 165.67,
      features: JSON.stringify([
        "Tudo do plano Mensal",
        "1 sessão de mentoria em grupo por mês",
        "Trilhas guiadas por tema",
        "Certificados de conclusão",
        "Economia de 16% no período",
      ]),
      highlight: true,
      active: true,
    },
    {
      id: planIds.anual,
      name: "Anual",
      price: 1597,
      period: "/ano",
      monthly_equivalent: 133.08,
      features: JSON.stringify([
        "Tudo do plano Trimestral",
        "1 mentoria individual por trimestre",
        "Diagnóstico do negócio com o mentor",
        "Acesso antecipado a novos conteúdos",
        "Economia de 32% no período",
      ]),
      highlight: false,
      active: true,
    },
  ]);
}
