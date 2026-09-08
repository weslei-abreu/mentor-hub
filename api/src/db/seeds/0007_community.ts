import { v4 as uuid } from "uuid";
import type { Knex } from "knex";
import { clienteIds, tagIds, videoId } from "../seedIds.js";

const daysAgo = (d: number) => new Date(Date.now() - d * 86400000);

const postSeeds: Array<[number, string, string | null]> = [
  [
    2,
    "Apliquei o fluxo de caixa de 13 semanas e descobri que meu problema não era faturamento, era prazo de recebimento. Mudei tudo pra 15 dias e o caixa respirou.",
    tagIds.financeiro,
  ],
  [
    6,
    "Alguém aqui já contratou a primeira liderança? Estou com medo de errar a mão e perder o time que já tenho.",
    tagIds.rh,
  ],
  [
    1,
    "O vídeo de posicionamento me fez pausar a campanha que estava rodando. Percebi que eu estava vendendo preço, não resultado.",
    tagIds.marketing,
  ],
  [
    3,
    "Dica prática: mapeei meu processo de atendimento em 1 folha e achei 3 etapas que só existiam por costume. Cortei e ninguém sentiu falta.",
    tagIds.processos,
  ],
  [
    4,
    "Montei o playbook comercial no fim de semana. Primeira semana usando e o time já parou de improvisar no discovery.",
    tagIds.vendas,
  ],
  [
    0,
    "Delegar continua sendo meu maior desafio. Sigo revisando tudo. Alguma dica de ritual que funcione de verdade?",
    tagIds.lideranca,
  ],
  [
    5,
    "Consegui separar PF de PJ esse mês. Parece bobagem, mas foi a primeira vez que entendi quanto a empresa realmente lucra.",
    tagIds.financeiro,
  ],
  [
    7,
    "Fiz a primeira rodada de feedback estruturado com a equipe. Tenso no começo, mas terminou com duas ideias ótimas de melhoria.",
    tagIds.rh,
  ],
  [
    2,
    "Comecei a rotina de prospecção de 45 minutos por dia. Duas semanas, 6 reuniões marcadas. Simples e funciona.",
    tagIds.vendas,
  ],
  [
    3,
    "Alguém tem um modelo de painel semanal de operação pra compartilhar? Estou montando o meu com 5 indicadores.",
    tagIds.processos,
  ],
  [
    4,
    "Ficou faltando um conteúdo sobre negociação com fornecedores. Seria muito útil pro meu momento.",
    null,
  ],
  [
    1,
    "Terminei todos os vídeos de Financeiro. Próxima parada: Vendas. Quem topa fazer junto e trocar figurinha aqui?",
    tagIds.financeiro,
  ],
];

const replyPool = [
  "Passei exatamente por isso ano passado. Vale muito seguir o roteiro do vídeo.",
  "Boa! Também comecei essa semana, bora acompanhar os resultados.",
  "Posso te mandar o modelo que uso, me chama.",
  "Concordo demais. O difícil é manter a constância depois do primeiro mês.",
  "Isso mudou meu jogo. Sério.",
];

export async function seed(knex: Knex): Promise<void> {
  const posts: Array<Record<string, unknown>> = [];
  const comments: Array<Record<string, unknown>> = [];
  const likes: Array<Record<string, unknown>> = [];

  postSeeds.forEach(([clienteIndex, text, tagId], i) => {
    const postId = uuid();
    const commentCount = i % 3 === 0 ? 0 : (i % 3) + 1;

    posts.push({
      id: postId,
      user_id: clienteIds[clienteIndex],
      text,
      tag_id: tagId,
      video_id: i % 4 === 0 ? videoId((i % 18) + 1) : null,
      likes_count: (i * 3) % 24,
      created_at: daysAgo(i * 3),
    });

    for (let j = 0; j < commentCount; j++) {
      comments.push({
        id: uuid(),
        post_id: postId,
        user_id: clienteIds[(clienteIndex + j + 1) % clienteIds.length],
        text: replyPool[(i + j) % replyPool.length],
        created_at: daysAgo(i * 2 + j),
      });
    }

    for (let k = 0; k < (i * 3) % 24; k += 5) {
      const likerIndex = (clienteIndex + k + 1) % clienteIds.length;
      likes.push({ id: uuid(), post_id: postId, user_id: clienteIds[likerIndex] });
    }
  });

  await knex("posts").insert(posts);
  if (comments.length > 0) await knex("comments").insert(comments);
  if (likes.length > 0) await knex("post_likes").insert(likes);
}
