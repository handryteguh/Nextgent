import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format angka ala Indonesia
export function fmtNum(n: number): string {
  return new Intl.NumberFormat("id-ID").format(n);
}

// Format compact: 1.2K, 3.4M
export function fmtCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

// Tanggal pendek: 20 Agu 2026
export function fmtDate(ts: string | Date): string {
  return new Date(ts).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Selisih waktu: "2 jam lalu"
export function timeAgo(ts: string | Date | number): string {
  const t = typeof ts === "number" ? ts : new Date(ts).getTime();
  if (!t || isNaN(t)) return "—";
  const diff = Date.now() - t;
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "baru saja";
  if (min < 60) return `${min}m lalu`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}j lalu`;
  const d = Math.floor(h / 24);
  return `${d}h lalu`;
}