import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "w-full rounded-lg border border-edge bg-surface-2 px-3 py-2 text-sm text-slate-100 placeholder:text-faint",
        "focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/60",
        "transition-colors",
        className
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "w-full rounded-lg border border-edge bg-surface-2 px-3 py-2 text-sm text-slate-100",
        "focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/60",
        "transition-colors",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Label({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label
      className={cn(
        "mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted",
        className
      )}
    >
      {children}
    </label>
  );
}