import { apiFetch } from "@/lib/api";
import type { Feedback } from "@/types";

export function listFeedbacks(videoId?: string) {
  return apiFetch<Feedback[]>("/feedbacks", { params: { videoId } });
}

export function createFeedback(payload: { videoId: string; rating: number; comment?: string }) {
  return apiFetch<Feedback>("/feedbacks", { method: "POST", body: payload });
}
