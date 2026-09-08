import { apiFetch } from "@/lib/api";
import type { Comment, Paginated, Post } from "@/types";

export interface PostListParams {
  tag?: string;
  unanswered?: boolean;
  from?: string;
  to?: string;
  page?: number;
  perPage?: number;
  [key: string]: string | number | boolean | undefined;
}

export function listPosts(params: PostListParams = {}) {
  return apiFetch<Paginated<Post>>("/community/posts", { params });
}

export function createPost(payload: { text: string; tag?: string; videoId?: string }) {
  return apiFetch<Post>("/community/posts", { method: "POST", body: payload });
}

export function toggleLike(postId: string) {
  return apiFetch<{ likesCount: number; likedByMe: boolean }>(`/community/posts/${postId}/like`, {
    method: "POST",
  });
}

export function addComment(postId: string, text: string) {
  return apiFetch<Comment>(`/community/posts/${postId}/comments`, {
    method: "POST",
    body: { text },
  });
}
