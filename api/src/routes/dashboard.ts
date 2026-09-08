import { Router } from "express";
import { db } from "../db/knex.js";
import { requireAuth, requireRole, type AuthenticatedRequest } from "../middlewares/auth.js";
import { checkModuleAccess } from "../middlewares/moduleAccess.js";
import { attachProgress, attachTags } from "../services/videoService.js";
import * as dashboardService from "../services/dashboardService.js";

export const dashboardRouter = Router();

dashboardRouter.use(requireAuth);

dashboardRouter.get(
  "/mentor",
  requireRole("admin", "mentor", "staff"),
  checkModuleAccess("dashboard", "view"),
  async (_req, res, next) => {
    try {
      res.json(await dashboardService.mentorDashboard());
    } catch (error) {
      next(error);
    }
  },
);

dashboardRouter.get("/aluno", async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user!.sub;

    let videos = await db("videos")
      .leftJoin("companies", "companies.id", "videos.company_id")
      .select("videos.*", "companies.name as company_name");
    videos = await attachTags(videos);
    videos = await attachProgress(videos, userId);

    const continuing = videos.find((v: any) => v.progress > 0 && v.progress < 100);
    const news = [...videos]
      .sort((a, b) => +new Date(b.published_at) - +new Date(a.published_at))
      .slice(0, 4);

    const progressByTag = new Map<string, { done: number; total: number }>();
    for (const v of videos as any[]) {
      for (const tag of v.tags as string[]) {
        const entry = progressByTag.get(tag) ?? { done: 0, total: 0 };
        entry.total += 1;
        if (v.progress >= 100) entry.done += 1;
        progressByTag.set(tag, entry);
      }
    }
    const topTags = [...progressByTag.entries()]
      .sort((a, b) => b[1].done - a[1].done)
      .slice(0, 2)
      .map(([tag]) => tag);

    const recommended = videos
      .filter((v: any) => v.progress < 100 && v.tags.some((t: string) => topTags.includes(t)))
      .slice(0, 4);

    const done = videos.filter((v: any) => v.progress >= 100).length;
    const totalMinutes = videos.reduce(
      (acc: number, v: any) => acc + Math.round((v.duration * v.progress) / 100),
      0,
    );

    res.json({
      continuing: continuing ?? videos[0] ?? null,
      news,
      recommended,
      done,
      totalVideos: videos.length,
      totalMinutes,
    });
  } catch (error) {
    next(error);
  }
});
