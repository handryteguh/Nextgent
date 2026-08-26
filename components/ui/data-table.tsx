import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type Column<T> = {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
};

/**
 * Mobile-first DataTable:
 * - HP (< md): tiap row jadi kartu bertumpuk (label + nilai), bukan tabel horizontal
 * - md+: tabel normal
 * `primaryKey` dipakai sebagai judul kartu di HP.
 */
export function DataTable<T extends { id: string | number }>({
  columns,
  rows,
  emptyText = "Tidak ada data",
  primaryKey,
}: {
  columns: Column<T>[];
  rows: T[];
  emptyText?: string;
  primaryKey?: string;
}) {
  // Kolom yang bakal jadi "judul" kartu di HP (primaryKey, atau kolom pertama)
  const titleKey = primaryKey ?? columns[0]?.key;

  return (
    <div>
      {/* ⚠️ Mobile: daftar kartu */}
      <div className="divide-y divide-edge/30 md:hidden">
        {rows.length === 0 && (
          <p className="px-4 py-10 text-center text-sm text-faint">{emptyText}</p>
        )}
        {rows.map((row) => (
          <div key={row.id} className="px-4 py-3.5">
            {/* Judul kartu */}
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="font-bold text-slate-100">
                {(() => {
                  const titleCol = columns.find((c) => c.key === titleKey);
                  return titleCol?.render
                    ? titleCol.render(row)
                    : String(row[titleKey as keyof T] ?? "—");
                })()}
              </span>
              {/* Kolom aksi (biasanya kanan) — tampil di pojok atas kartu */}
              {columns.find((c) => c.className?.includes("text-right")) && (
                <span className="flex shrink-0 gap-1">
                  {columns
                    .filter((c) => c.className?.includes("text-right"))
                    .map((c) => (
                      <span key={c.key}>{c.render ? c.render(row) : null}</span>
                    ))}
                </span>
              )}
            </div>
            {/* Field lain sebagai baris label:nilai */}
            <div className="space-y-1.5">
              {columns
                .filter((c) => c.key !== titleKey && !c.className?.includes("text-right"))
                .map((c) => (
                  <div key={c.key} className="flex items-start justify-between gap-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-faint">
                      {c.header}
                    </span>
                    <span className="text-right text-sm text-slate-300">
                      {c.render ? c.render(row) : String(row[c.key as keyof T] ?? "—")}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* ⚠️ md+: tabel normal */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-edge/60">
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={cn(
                    "px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-muted",
                    c.className
                  )}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-edge/30 transition-colors last:border-0 hover:bg-white/[0.02]"
              >
                {columns.map((c) => (
                  <td key={c.key} className={cn("px-4 py-3 text-slate-300", c.className)}>
                    {c.render ? c.render(row) : String(row[c.key as keyof T] ?? "—")}
                  </td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-faint">
                  {emptyText}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}