import { apiFetch } from "@/lib/api";
import type { LpSection } from "@/types";

export function publicContent() {
  return apiFetch<LpSection[]>("/lp/content");
}

export function adminContent() {
  return apiFetch<LpSection[]>("/lp/admin/content");
}

export function updateSection(
  sectionKey: string,
  content: Record<string, unknown>,
  active?: boolean,
) {
  return apiFetch<LpSection>(`/lp/admin/content/${sectionKey}`, {
    method: "PUT",
    body: { content, active },
  });
}

export function moveSection(sectionKey: string, direction: "up" | "down") {
  return apiFetch<LpSection[]>(`/lp/admin/content/${sectionKey}/order`, {
    method: "PATCH",
    body: { direction },
  });
}

export function uploadMedia(sectionKey: string, file: File, alt?: string) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("sectionKey", sectionKey);
  if (alt) formData.append("alt", alt);
  return apiFetch("/lp/admin/media", { method: "POST", body: formData });
}

export function deleteMedia(id: string) {
  return apiFetch(`/lp/admin/media/${id}`, { method: "DELETE" });
}
