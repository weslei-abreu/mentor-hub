import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type FilterValue = string | string[] | undefined;

export interface FilterOption {
  value: string;
  label: string;
}

export type FilterConfig =
  | { key: string; type: "search"; label: string; placeholder?: string }
  | { key: string; type: "select"; label: string; options: FilterOption[] }
  | { key: string; type: "multiselect"; label: string; options: FilterOption[] }
  | { key: string; type: "dateRange"; label: string };

export function FilterBar({
  filters,
  values,
  onChange,
  onClear,
}: {
  filters: FilterConfig[];
  values: Record<string, FilterValue>;
  onChange: (key: string, value: FilterValue) => void;
  onClear?: () => void;
}) {
  const hasActiveFilters = Object.values(values).some((v) =>
    Array.isArray(v) ? v.length > 0 : Boolean(v),
  );

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-3 sm:p-4">
      {filters.map((filter) => {
        if (filter.type === "search") {
          return (
            <div key={filter.key} className="min-w-[180px] flex-1 space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">
                {filter.label}
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={(values[filter.key] as string) ?? ""}
                  onChange={(e) => onChange(filter.key, e.target.value || undefined)}
                  placeholder={filter.placeholder ?? "Buscar…"}
                  className="h-9 pl-8 text-sm"
                />
              </div>
            </div>
          );
        }

        if (filter.type === "select") {
          return (
            <div key={filter.key} className="w-40 space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">
                {filter.label}
              </label>
              <Select
                value={(values[filter.key] as string) || "__all__"}
                onValueChange={(v) => onChange(filter.key, v === "__all__" ? undefined : v)}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todos</SelectItem>
                  {filter.options.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        }

        if (filter.type === "multiselect") {
          const selected = (values[filter.key] as string[]) ?? [];
          return (
            <div key={filter.key} className="min-w-[220px] flex-1 space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">
                {filter.label}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {filter.options.map((o) => {
                  const active = selected.includes(o.value);
                  return (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() =>
                        onChange(
                          filter.key,
                          active ? selected.filter((v) => v !== o.value) : [...selected, o.value],
                        )
                      }
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-[11px] transition-colors",
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-muted-foreground hover:border-primary/40",
                      )}
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        }

        const fromKey = `${filter.key}From`;
        const toKey = `${filter.key}To`;
        return (
          <div key={filter.key} className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">{filter.label}</label>
            <div className="flex items-center gap-1.5">
              <Input
                type="date"
                value={(values[fromKey] as string) ?? ""}
                onChange={(e) => onChange(fromKey, e.target.value || undefined)}
                className="h-9 w-[140px] text-sm"
              />
              <span className="text-xs text-muted-foreground">até</span>
              <Input
                type="date"
                value={(values[toKey] as string) ?? ""}
                onChange={(e) => onChange(toKey, e.target.value || undefined)}
                className="h-9 w-[140px] text-sm"
              />
            </div>
          </div>
        );
      })}

      {hasActiveFilters && onClear && (
        <Button variant="ghost" size="sm" className="h-9 gap-1.5 text-xs" onClick={onClear}>
          <X className="h-3.5 w-3.5" />
          Limpar
        </Button>
      )}
    </div>
  );
}
