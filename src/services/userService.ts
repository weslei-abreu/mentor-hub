import { apiFetch } from "@/lib/api";
import type { Paginated, Role, User } from "@/types";

export interface UserListParams {
  role?: Role;
  status?: "ativo" | "inativo";
  q?: string;
  createdFrom?: string;
  createdTo?: string;
  page?: number;
  perPage?: number;
  [key: string]: string | number | boolean | undefined;
}

export function listUsers(params: UserListParams = {}) {
  return apiFetch<Paginated<User & { created_at: string; last_access: string | null }>>("/users", {
    params,
  });
}

export function createUser(payload: {
  name: string;
  email: string;
  password: string;
  role: Role;
  business?: string;
}) {
  return apiFetch<User>("/users", { method: "POST", body: payload });
}

export function updateUser(
  id: string,
  payload: Partial<{ name: string; business: string; role: Role; status: "ativo" | "inativo" }>,
) {
  return apiFetch<User>(`/users/${id}`, { method: "PATCH", body: payload });
}

export function deleteUser(id: string) {
  return apiFetch(`/users/${id}`, { method: "DELETE" });
}

export function resetUserPassword(id: string, password: string) {
  return apiFetch<{ message: string }>(`/users/${id}/reset-password`, {
    method: "POST",
    body: { password },
  });
}
