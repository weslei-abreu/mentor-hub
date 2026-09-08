import type { Knex } from "knex";
import { companyIds } from "../seedIds.js";

export async function seed(knex: Knex): Promise<void> {
  await knex("companies").insert([
    {
      id: companyIds.c1,
      name: "Nortis Contábil",
      logo: "NC",
      description:
        "Contabilidade consultiva para pequenas e médias empresas, com foco em fluxo de caixa e planejamento tributário.",
      field: "Finanças & Contabilidade",
      link: "#",
    },
    {
      id: companyIds.c2,
      name: "Humanize RH",
      logo: "HR",
      description:
        "Consultoria de gente e cultura: recrutamento estruturado, avaliação de desempenho e clima organizacional.",
      field: "Recursos Humanos",
      link: "#",
    },
    {
      id: companyIds.c3,
      name: "Vetor Growth",
      logo: "VG",
      description:
        "Agência de aquisição focada em performance, posicionamento de marca e geração de demanda previsível.",
      field: "Marketing & Growth",
      link: "#",
    },
    {
      id: companyIds.c4,
      name: "Fluxo Lab",
      logo: "FL",
      description:
        "Especialistas em mapeamento e automação de processos operacionais para empresas em crescimento.",
      field: "Operações & Processos",
      link: "#",
    },
    {
      id: companyIds.c5,
      name: "Alta Comercial",
      logo: "AC",
      description:
        "Estruturação de máquinas de vendas: playbook, funil, metas e gestão de time comercial.",
      field: "Vendas B2B",
      link: "#",
    },
  ]);
}
