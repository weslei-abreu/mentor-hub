import { apiFetch } from "@/lib/api";
import type { PermissionMap } from "@/types";

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  business: string | null;
  avatar: string | null;
  status: "ativo" | "inativo";
  created_at: string;
  permissions: PermissionMap;
}

export function listStaff() {
  return apiFetch<StaffMember[]>("/staff");
}

export function getStaff(id: string) {
  return apiFetch<StaffMember>(`/staff/${id}`);
}

export function createStaff(payload: {
  name: string;
  email: string;
  password: string;
  business?: string;
  permissions?: PermissionMap;
}) {
  return apiFetch<StaffMember>("/staff", { method: "POST", body: payload });
}

export function updateStaff(
  id: string,
  payload: Partial<{ name: string; business: string; status: "ativo" | "inativo" }>,
) {
  return apiFetch<StaffMember>(`/staff/${id}`, { method: "PUT", body: payload });
}

export function deleteStaff(id: string) {
  return apiFetch(`/staff/${id}`, { method: "DELETE" });
}

export function resetStaffPassword(id: string, password: string) {
  return apiFetch<{ message: string }>(`/staff/${id}/reset-password`, {
    method: "POST",
    body: { password },
  });
}

export function getStaffPermissions(id: string) {
  return apiFetch<PermissionMap>(`/staff/${id}/permissions`);
}

export function updateStaffPermissions(id: string, permissions: PermissionMap) {
  return apiFetch<StaffMember>(`/staff/${id}/permissions`, {
    method: "PUT",
    body: { permissions },
  });
}
