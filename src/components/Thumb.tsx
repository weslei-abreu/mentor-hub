import { cn } from "@/lib/utils";
import financeiro from "@/assets/thumb-financeiro.jpg";
import rh from "@/assets/thumb-rh.jpg";
import marketing from "@/assets/thumb-marketing.jpg";
import processos from "@/assets/thumb-processos.jpg";
import vendas from "@/assets/thumb-vendas.jpg";
import lideranca from "@/assets/thumb-lideranca.jpg";

const tagImage: Record<string, string> = {
  Financeiro: financeiro,
  "RH & Pessoas": rh,
  Marketing: marketing,
  Processos: processos,
  Vendas: vendas,
  Liderança: lideranca,
};

const tagTint: Record<string, string> = {
  Financeiro: "from-[oklch(0.30_0.07_160)/0.85]",
  "RH & Pessoas": "from-[oklch(0.30_0.08_300)/0.85]",
  Marketing: "from-[oklch(0.32_0.12_42)/0.85]",
  Processos: "from-[oklch(0.30_0.07_230)/0.85]",
  Vendas: "from-[oklch(0.32_0.10_75)/0.85]",
  Liderança: "from-[oklch(0.30_0.08_15)/0.85]",
};

export function Thumb({
  tag,
  duration,
  className,
  label,
  imageUrl,
}: {
  tag: string;
  duration?: number;
  className?: string;
  label?: string;
  imageUrl?: string | null;
}) {
  return (
    <div
      className={cn(
        "relative flex items-end overflow-hidden rounded-lg bg-foreground p-3",
        className,
      )}
    >
      <img
        src={imageUrl ?? tagImage[tag] ?? processos}
        alt=""
        loading="lazy"
        width={1024}
        height={576}
        className="absolute inset-0 h-full w-full object-cover"
      />
      {!imageUrl && (
        <div
          className={cn(
            "pointer-events-none absolute inset-0 bg-gradient-to-t to-transparent mix-blend-multiply",
            tagTint[tag] ?? tagTint.Processos,
          )}
        />
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
      <span className="relative rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur">
        {label ?? tag}
      </span>
      {duration !== undefined && (
        <span className="absolute right-2 top-2 rounded bg-black/55 px-1.5 py-0.5 text-[11px] font-medium text-white backdrop-blur">
          {duration} min
        </span>
      )}
    </div>
  );
}
