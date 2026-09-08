import { v4 as uuid } from "uuid";
import type { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
  const sections = [
    {
      section_key: "hero",
      order: 1,
      content: {
        headline: "A plataforma de mentoria para donos de negócio",
        subheadline:
          "Aulas práticas, comunidade ativa e acompanhamento de progresso para quem toca um negócio no dia a dia.",
        cta_text: "Quero fazer parte",
      },
    },
    {
      section_key: "beneficios",
      order: 2,
      content: {
        title: "Por que o Locus Club",
        items: [
          {
            title: "Conteúdo direto ao ponto",
            description: "Aulas curtas e aplicáveis, sem enrolação teórica.",
          },
          {
            title: "Comunidade ativa",
            description: "Troque experiências com outros donos de negócio.",
          },
          {
            title: "Acompanhamento de progresso",
            description: "Veja sua evolução por tema e conquiste certificados.",
          },
        ],
      },
    },
    {
      section_key: "depoimentos",
      order: 3,
      content: {
        title: "Quem já está dentro",
        items: [
          {
            nome: "Marina Costa",
            empresa: "Ateliê MC",
            foto: "",
            frase: "Em 3 meses organizei o financeiro da minha empresa pela primeira vez.",
          },
          {
            nome: "Pedro Lima",
            empresa: "Lima Distribuidora",
            foto: "",
            frase: "O playbook comercial mudou completamente minha operação de vendas.",
          },
        ],
      },
    },
    {
      section_key: "planos",
      order: 4,
      content: {
        title: "Escolha seu plano",
        subtitle: "Cancele quando quiser, sem multa.",
      },
    },
    {
      section_key: "faq",
      order: 5,
      content: {
        title: "Perguntas frequentes",
        items: [
          {
            pergunta: "Posso cancelar quando quiser?",
            resposta: "Sim, o cancelamento é livre e sem multa.",
          },
          {
            pergunta: "Tem certificado?",
            resposta: "Sim, ao concluir 100% de um tema você recebe um certificado.",
          },
        ],
      },
    },
    {
      section_key: "footer",
      order: 6,
      content: {
        text: "Locus Club — mentoria para donos de negócio.",
        email: "contato@wecod.com.br",
      },
    },
  ];

  await knex("lp_content").insert(
    sections.map((s) => ({
      id: uuid(),
      section_key: s.section_key,
      content: JSON.stringify(s.content),
      order: s.order,
      active: true,
    })),
  );
}
