import { v4 as uuid } from "uuid";
import { db } from "../db/knex.js";

export async function attachTags<T extends { id: string }>(videos: T[]) {
  if (videos.length === 0) return videos as Array<T & { tags: string[] }>;
  const ids = videos.map((v) => v.id);
  const rows = await db("video_tags")
    .join("tags", "tags.id", "video_tags.tag_id")
    .whereIn("video_tags.video_id", ids)
    .select("video_tags.video_id", "tags.id as tag_id", "tags.name as tag_name");

  const byVideo = new Map<string, string[]>();
  for (const row of rows) {
    const list = byVideo.get(row.video_id) ?? [];
    list.push(row.tag_name);
    byVideo.set(row.video_id, list);
  }
  return videos.map((v) => ({ ...v, tags: byVideo.get(v.id) ?? [] }));
}

export async function attachProgress<T extends { id: string }>(
  videos: T[],
  userId: string | undefined,
) {
  if (!userId || videos.length === 0) return videos.map((v) => ({ ...v, progress: 0 }));
  const ids = videos.map((v) => v.id);
  const rows = await db("video_progress").whereIn("video_id", ids).where({ user_id: userId });
  const byVideo = new Map(rows.map((r) => [r.video_id, r.progress]));
  return videos.map((v) => ({ ...v, progress: byVideo.get(v.id) ?? 0 }));
}

const YOUTUBE_ID_PATTERNS = [
  /(?:youtube\.com\/watch\?v=)([\w-]{11})/,
  /(?:youtu\.be\/)([\w-]{11})/,
  /(?:youtube\.com\/shorts\/)([\w-]{11})/,
  /(?:youtube\.com\/embed\/)([\w-]{11})/,
];

export function extractYoutubeId(url: string): string | null {
  for (const pattern of YOUTUBE_ID_PATTERNS) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

export function youtubeThumbnailUrl(youtubeId: string): string {
  return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
}

export async function setTags(videoId: string, tagNames: string[]) {
  await db.transaction(async (trx) => {
    await trx("video_tags").where({ video_id: videoId }).del();
    for (const name of tagNames) {
      let tag = await trx("tags").where({ name }).first();
      if (!tag) {
        const id = uuid();
        await trx("tags").insert({ id, name });
        tag = { id, name };
      }
      await trx("video_tags").insert({ video_id: videoId, tag_id: tag.id });
    }
  });
}
