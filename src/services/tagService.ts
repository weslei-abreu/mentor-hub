import { apiFetch } from "@/lib/api";

export interface Tag {
  id: string;
  name: string;
}

export function listTags() {
  return apiFetch<Tag[]>("/tags");
}
