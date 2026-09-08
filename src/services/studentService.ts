import { apiFetch } from "@/lib/api";
import type { Paginated, Student, Video } from "@/types";

export function myProgress() {
  return apiFetch<{
    progressByTag: Array<{ tag: string; total: number; done: number; pct: number }>;
    watched: Video[];
  }>("/students/me/progress");
}

export interface StudentListParams {
  status?: "ativo" | "inativo";
  q?: string;
  createdFrom?: string;
  createdTo?: string;
  lastAccessFrom?: string;
  lastAccessTo?: string;
  sort?: "tempo_assistido";
  page?: number;
  perPage?: number;
  [key: string]: string | number | boolean | undefined;
}

export function listStudents(params: StudentListParams = {}) {
  return apiFetch<Paginated<Student>>("/students", { params });
}

export function getStudent(id: string) {
  return apiFetch<Student>(`/students/${id}`);
}
