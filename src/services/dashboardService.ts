import { apiFetch } from "@/lib/api";
import type { Video } from "@/types";

export interface MentorDashboard {
  kpis: {
    active: number;
    inactive: number;
    total: number;
    avgMinutes: number;
    avgCompletion: number;
  };
  accessSeries: Array<{ date: string; label: string; acessos: number }>;
  completionByTag: Array<{ tag: string; conclusao: number }>;
  topVideos: Array<{ title: string; alunos: number }>;
  interestDist: Array<{ tag: string; alunos: number }>;
  insights: Array<{
    id: string;
    severity: "alerta" | "atencao" | "oportunidade";
    title: string;
    detail: string;
    action: string;
    names?: string[];
  }>;
}

export function mentorDashboard() {
  return apiFetch<MentorDashboard>("/dashboard/mentor");
}

export interface AlunoDashboard {
  continuing: Video | null;
  news: Video[];
  recommended: Video[];
  done: number;
  totalVideos: number;
  totalMinutes: number;
}

export function alunoDashboard() {
  return apiFetch<AlunoDashboard>("/dashboard/aluno");
}
