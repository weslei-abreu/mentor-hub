import { apiFetch } from "@/lib/api";
import type { GraphLink, GraphNode, Paginated, TeiaContact, TeiaRequest } from "@/types";

export interface TeiaContactListParams {
  field?: string;
  city?: string;
  status?: "liberado" | "bloqueado";
  q?: string;
  page?: number;
  perPage?: number;
  [key: string]: string | number | boolean | undefined;
}

export function listContacts(params: TeiaContactListParams = {}) {
  return apiFetch<Paginated<TeiaContact>>("/teia/contacts", { params });
}

export function createContact(payload: {
  name: string;
  companyName?: string;
  field?: string;
  city?: string;
  phone?: string;
  email?: string;
}) {
  return apiFetch<TeiaContact>("/teia/contacts", { method: "POST", body: payload });
}

export function myRequests(type: "sent" | "received") {
  return apiFetch<TeiaRequest[]>("/teia/requests/mine", { params: { type } });
}

export function createRequest(contactId: string, message?: string) {
  return apiFetch<TeiaRequest>("/teia/requests", { method: "POST", body: { contactId, message } });
}

export function respondRequest(id: string, status: "aprovado" | "recusado") {
  return apiFetch<TeiaRequest>(`/teia/requests/${id}`, { method: "PATCH", body: { status } });
}

export function getGraph(rootId?: string) {
  return apiFetch<{ nodes: GraphNode[]; links: GraphLink[] }>("/teia/graph", {
    params: { rootId },
  });
}

export function getAdminGraph() {
  return apiFetch<{ nodes: GraphNode[]; links: GraphLink[] }>("/teia/admin/graph");
}

export interface AdminRequestListParams {
  field?: string;
  city?: string;
  status?: "pendente" | "aprovado" | "recusado";
  from?: string;
  to?: string;
  page?: number;
  perPage?: number;
  [key: string]: string | number | boolean | undefined;
}

export function adminListRequests(params: AdminRequestListParams = {}) {
  return apiFetch<Paginated<TeiaRequest & { contact_field: string; contact_city: string }>>(
    "/teia/admin/requests",
    {
      params,
    },
  );
}
