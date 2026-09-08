import { apiFetch } from "@/lib/api";
import type { Company } from "@/types";

export function listCompanies() {
  return apiFetch<Company[]>("/companies");
}

export function getCompany(id: string) {
  return apiFetch<Company>(`/companies/${id}`);
}
