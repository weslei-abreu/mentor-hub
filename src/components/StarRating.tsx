import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarRating({
  value,
  onChange,
  size = "sm",
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: "sm" | "lg";
}) {
  const cls = size === "lg" ? "h-7 w-7" : "h-3.5 w-3.5";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= Math.round(value);
        const star = (
          <Star
            className={cn(cls, filled ? "fill-warning text-warning" : "text-muted-foreground/40")}
          />
        );
        return onChange ? (
          <button
            key={n}
            type="button"
            aria-label={`${n} estrelas`}
            onClick={() => onChange(n)}
            className="transition-transform hover:scale-110"
          >
            {star}
          </button>
        ) : (
          <span key={n}>{star}</span>
        );
      })}
    </div>
  );
}
