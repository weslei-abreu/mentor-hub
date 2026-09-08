import { apiFetch } from "@/lib/api";
import type { Paginated, Video } from "@/types";

export interface VideoListParams {
  q?: string;
  tags?: string;
  companyId?: string;
  publishedFrom?: string;
  publishedTo?: string;
  sort?: "recentes" | "assistidos" | "avaliados";
  page?: number;
  perPage?: number;
  [key: string]: string | number | boolean | undefined;
}

export function listVideos(params: VideoListParams = {}) {
  return apiFetch<Paginated<Video>>("/videos", { params });
}

export function getVideo(id: string) {
  return apiFetch<Video>(`/videos/${id}`);
}

export type VideoSourceInput =
  | { source: "youtube"; youtubeUrl: string }
  | { source: "upload"; fileUrl: string; thumbnailUrl?: string };

export type CreateVideoPayload = {
  title: string;
  description?: string;
  duration: number;
  companyId?: string;
  tags: string[];
} & VideoSourceInput;

export function createVideo(payload: CreateVideoPayload) {
  return apiFetch<Video>("/videos", { method: "POST", body: payload });
}

export function updateVideo(
  id: string,
  payload: Partial<
    {
      title: string;
      description: string;
      duration: number;
      companyId: string;
      tags: string[];
    } & VideoSourceInput
  >,
) {
  return apiFetch<Video>(`/videos/${id}`, { method: "PATCH", body: payload });
}

export function updateVideoTags(id: string, tags: string[]) {
  return apiFetch<Video>(`/videos/${id}`, { method: "PATCH", body: { tags } });
}

export function updateVideoProgress(id: string, progress: number) {
  return apiFetch<{ progress: number }>(`/videos/${id}/progress`, {
    method: "PATCH",
    body: { progress },
  });
}

export async function uploadVideoFile(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const result = await apiFetch<{ url: string }>("/videos/upload-file", {
    method: "POST",
    body: formData,
  });
  return result.url;
}

export async function uploadVideoThumbnail(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const result = await apiFetch<{ url: string }>("/videos/upload-thumbnail", {
    method: "POST",
    body: formData,
  });
  return result.url;
}
