export type Role = "admin" | "mentor" | "aluno" | "staff";

export const MODULES = [
  "dashboard",
  "alunos",
  "conteudo",
  "comunidade",
  "financeiro",
  "teia",
  "usuarios",
  "lp",
  "staff",
] as const;

export type Module = (typeof MODULES)[number];

export const CAPABILITIES = ["view", "create", "edit", "delete"] as const;

export type Capability = (typeof CAPABILITIES)[number];

export interface ModulePermissions {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

export type PermissionMap = Partial<Record<Module, ModulePermissions>>;

export function hasAnyAccess(permissions: ModulePermissions | undefined): boolean {
  if (!permissions) return false;
  return permissions.view || permissions.create || permissions.edit || permissions.delete;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  business: string | null;
  avatar: string | null;
  status: "ativo" | "inativo";
  permissions: PermissionMap | null;
}

export interface Company {
  id: string;
  name: string;
  logo: string | null;
  description: string | null;
  field: string | null;
  link: string | null;
  videos?: Video[];
}

export interface Video {
  id: string;
  title: string;
  description: string | null;
  duration: number;
  published_at: string;
  company_id: string | null;
  company_name?: string | null;
  views: number;
  rating: number | string;
  ratings_count: number;
  tags: string[];
  progress: number;
  company?: Company | null;
  feedbacks?: Feedback[];
  related?: Video[];
  source: "youtube" | "upload" | null;
  youtube_id: string | null;
  youtube_url: string | null;
  file_url: string | null;
  thumbnail_url: string | null;
}

export interface Feedback {
  id: string;
  video_id: string;
  user_id: string;
  user_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface Plan {
  id: string;
  name: string;
  price: number | string;
  period: string;
  monthly_equivalent: number | string;
  features: string[];
  highlight: boolean;
  active: boolean;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  plan_name?: string;
  status: "ativo" | "atrasado" | "cancelado";
  started_at: string;
  next_charge: string | null;
  amount: number | string;
  billing_type: "CREDIT_CARD" | "PIX" | "BOLETO" | null;
  asaas_subscription_id: string | null;
  card_last4: string | null;
  card_brand: string | null;
}

export interface Transaction {
  id: string;
  user_id: string;
  user_name?: string;
  plan_id: string;
  plan_name?: string;
  amount: number | string;
  status: "aprovado" | "recusado" | "pendente";
  method: "cartao" | "pix" | "boleto";
  date: string;
  invoice_url: string | null;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  author_name: string;
  text: string;
  created_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  author_name: string;
  text: string;
  tag_name: string | null;
  video_id: string | null;
  likes_count: number;
  likedByMe: boolean;
  comments: Comment[];
  created_at: string;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  business: string | null;
  created_at: string;
  last_access: string | null;
  active: boolean;
  minutesWatched: number;
  completion: { done: number; total: number; pct: number };
  progressByTag?: Array<{ tag: string; total: number; done: number; pct: number }>;
  tagInterest?: Array<{ tag: string; score: number }>;
  watched?: Video[];
}

export interface TeiaContact {
  id: string;
  name: string;
  companyName: string | null;
  field: string | null;
  city: string | null;
  registeredById: string;
  isOwner: boolean;
  unlocked: boolean;
  myRequestStatus: "pendente" | "aprovado" | "recusado" | null;
  phone: string | null;
  email: string | null;
}

export interface TeiaRequest {
  id: string;
  contact_id: string;
  requested_by_id: string;
  status: "pendente" | "aprovado" | "recusado";
  message: string | null;
  responded_at: string | null;
  created_at: string;
  contact_name?: string;
  requester_name?: string;
}

export interface GraphNode {
  id: string;
  name: string;
  field: string | null;
  city: string | null;
  type: "user" | "contact";
}

export interface GraphLink {
  source: string;
  target: string;
}

export interface LpMedia {
  id: string;
  section_key: string;
  url: string;
  alt: string | null;
  order: number;
}

export interface LpSection {
  id: string;
  section_key: "hero" | "beneficios" | "depoimentos" | "planos" | "faq" | "footer";
  content: Record<string, unknown>;
  order: number;
  active: boolean;
  media?: LpMedia[];
}

export interface Paginated<T> {
  data: T[];
  meta: { page: number; perPage: number; total: number; totalPages: number };
}

export const BRAND = {
  name: "Locus Club",
  tagline: "A plataforma de mentoria para donos de negócio",
};
