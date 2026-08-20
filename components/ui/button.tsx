import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "outline" | "ghost" | "danger" | "success";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-[#0B0E14] font-bold hover:bg-accent-hover shadow-[0_0_20px_rgba(245,192,68,0.15)]",
  outline:
    "border border-edge text-slate-200 hover:bg-white/5",
  ghost: "text-slate-300 hover:bg-white/5",
  danger:
    "bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20",
  success:
    "bg-success/10 text-success border border-success/30 hover:bg-success/20",
};

const sizes: Record<Size, string> = {
  sm: "px-2.5 py-1.5 text-xs rounded-lg",
  md: "px-4 py-2 text-sm rounded-xl",
  lg: "px-5 py-2.5 text-base rounded-xl",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 font-semibold transition-colors disabled:opacity-40 disabled:pointer-events-none",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}