import { db } from "../db/knex.js";
import { isActive } from "./studentService.js";

interface BulkData {
  students: Array<{ id: string; name: string; last_access: Date | null }>;
  videos: Array<{ id: string; title: string; rating: number }>;
  tags: Array<{ id: string; name: string }>;
  videoTags: Array<{ video_id: string; tag_id: string }>;
  progress: Array<{ user_id: string; video_id: string; progress: number }>;
}

async function loadBulkData(): Promise<BulkData> {
  const [students, videos, tags, videoTags, progress] = await Promise.all([
    db("users").where({ role: "aluno" }).select("id", "name", "last_access"),
    db("videos").select("id", "title", "rating"),
    db("tags").select("id", "name"),
    db("video_tags").select("video_id", "tag_id"),
    db("video_progress").select("user_id", "video_id", "progress"),
  ]);
  return { students, videos, tags, videoTags, progress };
}

export async function mentorDashboard() {
  const { students, videos, tags, videoTags, progress } = await loadBulkData();

  const active = students.filter((s) => isActive(s.last_access)).length;
  const inactive = students.length - active;

  const minutesByStudent = new Map<string, number>();
  const doneByStudent = new Map<string, number>();
  const progressByStudentVideo = new Map<string, Map<string, number>>();

  for (const p of progress) {
    const map = progressByStudentVideo.get(p.user_id) ?? new Map();
    map.set(p.video_id, p.progress);
    progressByStudentVideo.set(p.user_id, map);
    if (p.progress >= 100) doneByStudent.set(p.user_id, (doneByStudent.get(p.user_id) ?? 0) + 1);
  }

  const videoRows = await db("videos").select("id", "duration");
  const durationById = new Map(videoRows.map((v) => [v.id, v.duration]));
  for (const p of progress) {
    const minutes = Math.round(((durationById.get(p.video_id) ?? 0) * p.progress) / 100);
    minutesByStudent.set(p.user_id, (minutesByStudent.get(p.user_id) ?? 0) + minutes);
  }

  const totalVideos = videos.length;
  const avgMinutes =
    students.length > 0
      ? Math.round(
          students.reduce((acc, s) => acc + (minutesByStudent.get(s.id) ?? 0), 0) / students.length,
        )
      : 0;
  const avgCompletion =
    students.length > 0 && totalVideos > 0
      ? Math.round(
          students.reduce(
            (acc, s) => acc + ((doneByStudent.get(s.id) ?? 0) / totalVideos) * 100,
            0,
          ) / students.length,
        )
      : 0;

  const tagByVideo = new Map<string, string[]>();
  for (const vt of videoTags) {
    const list = tagByVideo.get(vt.video_id) ?? [];
    list.push(vt.tag_id);
    tagByVideo.set(vt.video_id, list);
  }

  const completionByTag = tags.map((tag) => {
    const tagVideoIds = videoTags.filter((vt) => vt.tag_id === tag.id).map((vt) => vt.video_id);
    if (tagVideoIds.length === 0 || students.length === 0) return { tag: tag.name, conclusao: 0 };
    let sumPct = 0;
    for (const s of students) {
      const map = progressByStudentVideo.get(s.id);
      const done = tagVideoIds.filter((vid) => (map?.get(vid) ?? 0) >= 100).length;
      sumPct += (done / tagVideoIds.length) * 100;
    }
    return { tag: tag.name, conclusao: Math.round(sumPct / students.length) };
  });

  const watchersByVideo = new Map<string, number>();
  for (const p of progress) {
    if (p.progress > 0) watchersByVideo.set(p.video_id, (watchersByVideo.get(p.video_id) ?? 0) + 1);
  }
  const topVideos = videos
    .map((v) => ({ title: v.title, alunos: watchersByVideo.get(v.id) ?? 0 }))
    .sort((a, b) => b.alunos - a.alunos)
    .slice(0, 8);

  const interestByTag = new Map<string, number>();
  for (const p of progress) {
    const tagIds = tagByVideo.get(p.video_id) ?? [];
    for (const tagId of tagIds) {
      interestByTag.set(tagId, (interestByTag.get(tagId) ?? 0) + p.progress / 100);
    }
  }
  const interestDist = tags
    .map((tag) => ({ tag: tag.name, alunos: Math.round(interestByTag.get(tag.id) ?? 0) }))
    .filter((t) => t.alunos > 0);

  const now = new Date();
  const accessSeries = [];
  for (let i = 29; i >= 0; i--) {
    const day = new Date(now.getTime() - i * 86400000);
    const dayKey = day.toISOString().slice(0, 10);
    const [{ count }] = await db("video_progress")
      .countDistinct<{ count: string }[]>("user_id as count")
      .whereRaw("DATE(watched_at) = ?", [dayKey]);
    accessSeries.push({
      date: dayKey,
      label: day.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      acessos: Number(count),
    });
  }

  const insights = await buildInsights(students, videos, completionByTag);

  return {
    kpis: { active, inactive, total: students.length, avgMinutes, avgCompletion },
    accessSeries,
    completionByTag,
    topVideos,
    interestDist,
    insights,
  };
}

async function buildInsights(
  students: BulkData["students"],
  videos: BulkData["videos"],
  completionByTag: Array<{ tag: string; conclusao: number }>,
) {
  const insights: Array<{
    id: string;
    severity: "alerta" | "atencao" | "oportunidade";
    title: string;
    detail: string;
    action: string;
    names?: string[];
  }> = [];

  const dormant = students.filter((s) => {
    if (!s.last_access) return true;
    const days = (Date.now() - new Date(s.last_access).getTime()) / 86400000;
    return days > 14;
  });
  if (dormant.length > 0) {
    insights.push({
      id: "dormant-students",
      severity: "alerta",
      title: `${dormant.length} aluno(s) sem acesso há mais de 14 dias`,
      detail: "Esses alunos podem estar prestes a cancelar. Vale um contato direto.",
      action: "Ver alunos inativos",
      names: dormant.slice(0, 5).map((s) => s.name),
    });
  }

  const lowRated = videos.filter((v) => v.rating > 0 && v.rating < 3);
  if (lowRated.length > 0) {
    insights.push({
      id: "low-rated-videos",
      severity: "atencao",
      title: `${lowRated.length} vídeo(s) com nota baixa`,
      detail: "Considere revisar o conteúdo ou complementar com material de apoio.",
      action: "Ver conteúdo",
      names: lowRated.slice(0, 5).map((v) => v.title),
    });
  }

  const worstTag = [...completionByTag].sort((a, b) => a.conclusao - b.conclusao)[0];
  if (worstTag && worstTag.conclusao < 50) {
    insights.push({
      id: "worst-completion-tag",
      severity: "atencao",
      title: `Tema "${worstTag.tag}" com conclusão baixa (${worstTag.conclusao}%)`,
      detail: "Os alunos estão começando mas não terminando as aulas desse tema.",
      action: "Ver conteúdo do tema",
    });
  }

  const late = await db("subscriptions")
    .where({ status: "atrasado" })
    .count<{ count: string }[]>("id as count");
  const lateCount = Number(late[0]?.count ?? 0);
  if (lateCount > 0) {
    insights.push({
      id: "late-subscriptions",
      severity: "alerta",
      title: `${lateCount} assinatura(s) em atraso`,
      detail: "Cobranças pendentes podem virar cancelamento se não forem regularizadas.",
      action: "Ver financeiro",
    });
  }

  if (insights.length === 0) {
    insights.push({
      id: "all-good",
      severity: "oportunidade",
      title: "Engajamento saudável este mês",
      detail: "Nenhum alerta crítico identificado no momento.",
      action: "Ver dashboard completo",
    });
  }

  return insights;
}
