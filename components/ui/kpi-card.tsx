import { ReactNode } from "react";

type KpiColor = "accent" | "violet" | "orange" | "info" | "success" | "danger";

const iconColors: Record<KpiColor, string> = {
  accent: "bg-accent/10 text-accent",
  violet: "bg-violet/10 text-violet",
  orange: "bg-orange/10 text-orange",
  info: "bg-info/10 text-info",
  success: "bg-success/10 text-success",
  danger: "bg-danger/10 text-danger",
};

export function KpiCard({
  label,
  value,
  sub,
  icon,
  color = "accent",
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: ReactNode;
  color?: KpiColor;
}) {
  return (
    <div className="rounded-xl border border-edge bg-surface p-5 shadow-[0_4px_24px_rgba(0,0,0,0.25)] transition-colors hover:border-edge/80">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
            {label}
          </p>
          <p className="mt-1.5 text-3xl font-extrabold tracking-tight text-slate-100">
            {value}
          </p>
          {sub && <p className="mt-1 text-xs text-faint">{sub}</p>}
        </div>
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconColors[color]}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}