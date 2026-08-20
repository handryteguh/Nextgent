"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Deal = {
  id: number;
  title: string;
  value: string;
  contact: string;
  due?: string;
  color: string;
};

const initialColumns: { id: string; label: string; color: string; deals: Deal[] }[] = [
  {
    id: "baru",
    label: "Baru",
    color: "bg-info",
    deals: [
      { id: 1, title: "Paket Pro — Toko Online", value: "Rp 350rb", contact: "Yan Azmi", color: "#22D3EE" },
      { id: 2, title: "Basic — Bengkel", value: "Rp 150rb", contact: "Fajar Servis", color: "#22D3EE" },
    ],
  },
  {
    id: "dihubungi",
    label: "Dihubungi",
    color: "bg-violet",
    deals: [
      { id: 3, title: "Pro Max — Mebel", value: "Rp 750rb", contact: "Ranti Mebel", due: "26 Agu", color: "#A78BFA" },
    ],
  },
  {
    id: "qualified",
    label: "Qualified",
    color: "bg-accent",
    deals: [
      { id: 4, title: "Paket Pro — Studio", value: "Rp 350rb", contact: "Ari Studio", due: "22 Agu", color: "#F5C044" },
    ],
  },
  {
    id: "won",
    label: "Menang",
    color: "bg-success",
    deals: [
      { id: 5, title: "Basic — UMKM", value: "Rp 150rb", contact: "Prasetyo", color: "#34D399" },
    ],
  },
];

export default function DealsPage() {
  const [columns, setColumns] = useState(initialColumns);
  const [dragging, setDragging] = useState<{ dealId: number; fromCol: string } | null>(null);

  const onDrop = (colId: string) => {
    if (!dragging) return;
    setColumns((cols) =>
      cols.map((col) => {
        if (col.id === dragging.fromCol) {
          return { ...col, deals: col.deals.filter((d) => d.id !== dragging.dealId) };
        }
        if (col.id === colId) {
          const deal = cols.find((c) => c.id === dragging.fromCol)?.deals.find((d) => d.id === dragging.dealId);
          return deal ? { ...col, deals: [...col.deals, deal] } : col;
        }
        return col;
      })
    );
    setDragging(null);
  };

  return (
    <div>
      <PageHeader
        title="Deals"
        subtitle="Pipeline penjualan — drag & drop antar tahap"
        actions={<Button size="sm">+ Tambah Deal</Button>}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {columns.map((col) => (
          <div
            key={col.id}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => onDrop(col.id)}
            className={cn(
              "rounded-xl border border-edge/60 bg-surface-2/40 p-3 transition-colors",
              dragging && "border-dashed border-accent/50"
            )}
          >
            <div className="mb-3 flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className={cn("h-2 w-2 rounded-full", col.color)} />
                <span className="text-sm font-bold text-slate-100">{col.label}</span>
              </div>
              <Badge>{col.deals.length}</Badge>
            </div>
            <div className="space-y-2.5">
              {col.deals.map((deal) => (
                <div
                  key={deal.id}
                  draggable
                  onDragStart={() => setDragging({ dealId: deal.id, fromCol: col.id })}
                  onDragEnd={() => setDragging(null)}
                  className="cursor-grab rounded-lg border border-edge bg-surface p-3.5 transition-shadow hover:shadow-[0_4px_16px_rgba(0,0,0,0.3)] active:cursor-grabbing"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-100">{deal.title}</p>
                    <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: deal.color }} />
                  </div>
                  <p className="mt-1 text-xs font-bold text-accent">{deal.value}</p>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-faint">
                    <span>{deal.contact}</span>
                    {deal.due && <span>⏰ {deal.due}</span>}
                  </div>
                </div>
              ))}
              {col.deals.length === 0 && (
                <p className="py-6 text-center text-xs text-faint">Drop deal di sini</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}