"use client";

import { cn } from "@/lib/utils";

export type Pill = {
  key: string;
  label: string;
  count?: number;
};

export function FilterPills({
  pills,
  active,
  onChange,
}: {
  pills: Pill[];
  active: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:overflow-visible md:px-0 md:pb-0">
      {pills.map((p) => (
        <button
          key={p.key}
          onClick={() => onChange(p.key)}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
            active === p.key
              ? "bg-accent text-[#0B0E14]"
              : "border border-edge text-muted hover:bg-white/5 hover:text-slate-200"
          )}
        >
          {p.label}
          {typeof p.count === "number" && (
            <span className={cn("ml-1.5", active === p.key ? "text-[#0B0E14]/70" : "text-faint")}>
              {p.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}