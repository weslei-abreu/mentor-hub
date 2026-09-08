export const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });

export const brlShort = (v: number) =>
  v >= 1000 ? `R$ ${(v / 1000).toFixed(1).replace(".", ",")}k` : `R$ ${v.toFixed(0)}`;

export const dateBR = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "—";

export const dateShort = (iso: string) =>
  iso ? new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) : "—";

export function relative(iso: string | null, now = new Date()) {
  if (!iso) return "—";
  const diff = Math.floor((now.getTime() - new Date(iso).getTime()) / 86400000);
  if (diff <= 0) return "hoje";
  if (diff === 1) return "ontem";
  if (diff < 30) return `há ${diff} dias`;
  const m = Math.floor(diff / 30);
  return `há ${m} ${m === 1 ? "mês" : "meses"}`;
}

export function daysSince(iso: string | null, now = new Date()) {
  if (!iso) return Infinity;
  return Math.floor((now.getTime() - new Date(iso).getTime()) / 86400000);
}

export const minutesLabel = (m: number) =>
  m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}min` : `${m}min`;
