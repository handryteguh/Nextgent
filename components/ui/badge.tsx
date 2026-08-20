import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeVariant =
  | "default"
  | "success"
  | "danger"
  | "warning"
  | "info"
  | "violet";

const variants: Record<BadgeVariant, string> = {
  default: "bg-white/5 text-slate-300 border border-edge",
  success: "bg-success/10 text-success border border-success/25",
  danger: "bg-danger/10 text-danger border border-danger/25",
  warning: "bg-orange/10 text-orange border border-orange/25",
  info: "bg-info/10 text-info border border-info/25",
  violet: "bg-violet/10 text-violet border border-violet/25",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ variant = "default", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}