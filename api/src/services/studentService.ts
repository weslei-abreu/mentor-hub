import { db } from "../db/knex.js";
import { attachTags } from "./videoService.js";

const ACTIVE_WINDOW_DAYS = 7;

export function isActive(lastAccess: Date | string | null): boolean {
  if (!lastAccess) return false;
  const days = (Date.now() - new Date(lastAccess).getTime()) / 86400000;
  return days <= ACTIVE_WINDOW_DAYS;
}

export async function totalVideosCount(): Promise<number> {
  const [{ count }] = await db("videos").count<{ count: string }[]>("id as count");
  return Number(count);
}

export async function completionOf(userId: string) {
  const total = await totalVideosCount();
  const [{ count }] = await db("video_progress")
    .where({ user_id: userId })
    .where("progress", ">=", 100)
    .count<{ count: string }[]>("id as count");
  const done = Number(count);
  return { done, total, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
}

export async function minutesWatchedOf(userId: string) {
  const rows = await db("video_progress")
    .join("videos", "videos.id", "video_progress.video_id")
    .where({ user_id: userId })
    .select("videos.duration", "video_progress.progress");
  return rows.reduce((acc, r) => acc + Math.round((r.duration * r.progress) / 100), 0);
}

export async function progressByTag(userId: string) {
  const tags = await db("tags").orderBy("name", "asc");
  const rows = await db("video_tags")
    .join("videos", "videos.id", "video_tags.video_id")
    .leftJoin("video_progress", (join) => {
      join
        .on("video_progress.video_id", "videos.id")
        .andOn("video_progress.user_id", db.raw("?", [userId]));
    })
    .select("video_tags.tag_id", "videos.id as video_id", "video_progress.progress as progress");

  const byTag = new Map<string, { total: number; done: number }>();
  for (const row of rows) {
    const entry = byTag.get(row.tag_id) ?? { total: 0, done: 0 };
    entry.total += 1;
    if ((row.progress ?? 0) >= 100) entry.done += 1;
    byTag.set(row.tag_id, entry);
  }

  return tags.map((tag) => {
    const entry = byTag.get(tag.id) ?? { total: 0, done: 0 };
    return {
      tag: tag.name,
      total: entry.total,
      done: entry.done,
      pct: entry.total > 0 ? Math.round((entry.done / entry.total) * 100) : 0,
    };
  });
}

export async function tagInterest(userId: string) {
  const byTag = await progressByTag(userId);
  const rows = await db("video_tags")
    .join("tags", "tags.id", "video_tags.tag_id")
    .leftJoin("video_progress", (join) => {
      join
        .on("video_progress.video_id", "video_tags.video_id")
        .andOn("video_progress.user_id", db.raw("?", [userId]));
    })
    .select("tags.name as tag", "video_progress.progress as progress");

  const scoreByTag = new Map<string, number>();
  for (const row of rows) {
    scoreByTag.set(row.tag, (scoreByTag.get(row.tag) ?? 0) + (row.progress ?? 0) / 100);
  }

  return byTag
    .map((t) => ({ tag: t.tag, score: scoreByTag.get(t.tag) ?? 0 }))
    .sort((a, b) => b.score - a.score);
}

export async function watchedHistory(userId: string) {
  const rows = await db("video_progress")
    .join("videos", "videos.id", "video_progress.video_id")
    .where({ user_id: userId })
    .where("video_progress.progress", ">", 0)
    .select("videos.*", "video_progress.progress as progress")
    .orderBy("video_progress.watched_at", "desc");
  return attachTags(rows);
}
