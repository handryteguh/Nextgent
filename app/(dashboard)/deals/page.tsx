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
  status: "open" | "won" | "lost";
  color: string;
};

// ⚠️ Prototipe statis Phase 0 — data dummy, belum nyambung DB.
// Pipeline: New → Contacted → Qualified → Proposal → Negotiation → Won/Lost
const initialColumns: { id: string; label: string; color: string; deals: Deal[] }[] = [
  {
    id: "new",
    label: "New",
    color: "bg-info",
    deals: [
      { id: 1, title: "Paket Pro — Toko Online", value: "Rp 350rb", contact: "Yan Azmi", status: "open", color: "#22D3EE" },
      { id: 2, title: "Basic — Bengkel", value: "Rp 150rb", contact: "Fajar Servis", status: "open", color: "#22D3EE" },
    ],
  },
  {
    id: "contacted",
    label: "Contacted",
    color: "bg-violet",
    deals: [
      { id: 3, title: "Pro Max — Mebel", value: "Rp 750rb", contact: "Ranti Mebel", due: "26 Agu", status: "open", color: "#A78BFA" },
    ],
  },
  {
    id: "qualified",
    label: "Qualified",
    color: "bg-accent",
    deals: [
      { id: 4, title: "Paket Pro — Studio", value: "Rp 350rb", contact: "Ari Studio", due: "22 Agu", status: "open", color: "#F5C044" },
    ],
  },
  {
    id: "proposal",
    label: "Proposal",
    color: "bg-orange",
    deals: [
      { id: 7, title: "Paket Pro — Klinik", value: "Rp 350rb", contact: "Evi Yuslatin", due: "28 Agu", status: "open", color: "#FB923C" },
    ],
  },
  {
    id: "negotiation",
    label: "Negotiation",
    color: "bg-danger",
    deals: [
      { id: 8, title: "Pro Max — Pabrik", value: "Rp 750rb", contact: "Prasetyo", due: "30 Agu", status: "open", color: "#FB7185" },
    ],
  },
  {
    id: "won_lost",
    label: "Won / Lost",
    color: "bg-success",
    deals: [
      { id: 5, title: "Basic — UMKM", value: "Rp 150rb", contact: "Prasetyo", status: "won", color: "#34D399" },
      { id: 6, title: "Trial — Toko", value: "Rp 0", contact: "Maya Jaya", status: "lost", color: "#475569" },
    ],
  },
];

const stageProbability: Record<string, number> = {
  new: 0.1, contacted: 0.2, qualified: 0.4, proposal: 0.6, negotiation: 0.8, won_lost: 1,
};

const statusBadge: Record<Deal["status"], { label: string; variant: "success" | "danger" | "default" }> = {
  open: { label: "Open", variant: "default" },
  won: { label: "Won", variant: "success" },
  lost: { label: "Lost", variant: "danger" },
};

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

  const openDeals = columns.flatMap((c) => c.deals.filter((d) => d.status === "open"));
  const totalValue = openDeals.reduce((sum, d) => sum + parseInt(d.value.replace(/[^\d]/g, "") || "0"), 0);

  return (
    <div>
      <PageHeader
        title="Deals"
        subtitle="Pipeline penjualan — drag & drop antar tahap. Won/Lost = status object, bukan stage."
        actions={<Button size="sm">+ Tambah Deal</Button>}
      />

      {/* Ringkasan pipeline — mobile: 3 kolom kecil, desktop: row */}
      <div className="mb-6 grid grid-cols-3 gap-3 rounded-xl border border-edge/60 bg-surface-2/40 px-4 py-3.5 md:flex md:flex-wrap md:gap-4 md:px-5 md:py-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Deal Aktif</span>
          <p className="text-lg font-extrabold text-slate-100">{openDeals.length}</p>
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Nilai Pipeline</span>
          <p className="text-lg font-extrabold text-accent">Rp {totalValue.toLocaleString("id-ID")}</p>
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Forecast</span>
          <p className="text-lg font-extrabold text-slate-100">
            Rp {openDeals.reduce((sum, d) => {
              const col = columns.find((c) => c.deals.some((x) => x.id === d.id));
              return sum + (parseInt(d.value.replace(/[^\d]/g, "") || "0") * (col ? stageProbability[col.id] : 0));
            }, 0).toLocaleString("id-ID")}
          </p>
        </div>
        <div className="col-span-3 hidden items-center gap-4 text-[11px] text-muted md:col-span-0 md:ml-auto md:flex">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-accent" /> Masuk Negotiation → auto-trigger sequence FU</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-success" /> Won/Lost → stop sequence</span>
        </div>
      </div>

      {/* ⚠️ Mobile-first: kanban jadi swipe horizontal per stage. Desktop: grid 6 kolom. */}
      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4 md:mx-0 md:grid md:grid-cols-2 md:gap-4 md:overflow-visible md:px-0 lg:grid-cols-3 2xl:grid-cols-6">
        {columns.map((col) => (
          <div
            key={col.id}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => onDrop(col.id)}
            className={cn(
              "w-[78vw] shrink-0 snap-center rounded-xl border border-edge/60 bg-surface-2/40 p-3 transition-colors md:w-auto",
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
                  {deal.status !== "open" && (
                    <div className="mt-2">
                      <Badge variant={statusBadge[deal.status].variant}>{statusBadge[deal.status].label}</Badge>
                    </div>
                  )}
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