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

export async function seed(knex: Knex): Promise<void> {
  const r = rng(20260817);
  const videoIds = Array.from({ length: 18 }, (_, i) => videoId(i + 1));
  const rows: Array<Record<string, unknown>> = [];

  for (const userId of clienteIds) {
    const watchCount = Math.floor(r() * videoIds.length);
    const shuffled = [...videoIds].sort(() => r() - 0.5).slice(0, watchCount);
    for (const videoIdValue of shuffled) {
      const progress = r() < 0.55 ? 100 : Math.floor(r() * 84) + 8;
      rows.push({
        id: uuid(),
        user_id: userId,
        video_id: videoIdValue,
        progress,
        watched_at: daysAgo(Math.floor(r() * 45)),
      });
    }
  }

  await knex("video_progress").insert(rows);
}
