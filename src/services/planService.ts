import { apiFetch } from "@/lib/api";
import type { Plan } from "@/types";

export function listPlans() {
  return apiFetch<Plan[]>("/plans");
}
