import { v4 as uuid } from "uuid";
import type { Knex } from "knex";
import { clienteIds, videoId } from "../seedIds.js";

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const daysAgo = (d: number) => new Date(Date.now() - d * 86400000);

const goodComments = [
  "Direto ao ponto, sem enrolação. Já apliquei.",
  "Excelente. Os exemplos práticos fizeram toda a diferença.",
  "Material complementar salvou meu mês.",
];
const okComments = [
  "Bom conteúdo, mas ficou teórico demais pro meu porte de empresa.",
  "Senti falta de um exemplo real de aplicação.",
  "Um pouco longo, daria pra cortar pela metade.",
];

export async function seed(knex: Knex): Promise<void> {
  const r = rng(778899);
  const rows = Array.from({ length: 46 }, (_, i) => {
    const rating = Math.floor(r() * 4) + 2;
    const comment =
      rating >= 4
        ? goodComments[Math.floor(r() * goodComments.length)]
        : okComments[Math.floor(r() * okComments.length)];
    return {
      id: uuid(),
      video_id: videoId(Math.floor(r() * 18) + 1),
      user_id: clienteIds[Math.floor(r() * clienteIds.length)],
      rating,
      comment,
      created_at: daysAgo(Math.floor(r() * 90) + 1),
    };
  });

  await knex("feedbacks").insert(rows);

  const videoIds = Array.from({ length: 18 }, (_, i) => videoId(i + 1));
  for (const id of videoIds) {
    const agg = await knex("feedbacks")
      .where({ video_id: id })
      .avg("rating as avg")
      .count("id as count")
      .first();
    if (Number(agg?.count ?? 0) > 0) {
      await knex("videos")
        .where({ id })
        .update({ rating: Number(agg!.avg).toFixed(1), ratings_count: Number(agg!.count) });
    }
  }
}
