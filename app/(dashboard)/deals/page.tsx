"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────
type DealStatus = "open" | "won" | "lost";
type DealStage = "New" | "Contacted" | "Qualified" | "Proposal" | "Negotiation";

type Deal = {
  id: number;
  title: string;
  value: number; // IDR integer
  stage: DealStage;
  status: DealStatus;
  contactId: number | null;
  expectedClose: string | null;
  wonAt: number | null;
  lostReason: string | null;
  notes: string | null;
  createdAt: number;
  updatedAt: number;
  // joined
  contactName?: string | null;
};

// ── Config ────────────────────────────────────────────────────────────────────
const STAGES: { id: DealStage; label: string; color: string; dotClass: string; prob: number }[] = [
  { id: "New",         label: "New",         color: "#22D3EE", dotClass: "bg-info",    prob: 0.1 },
  { id: "Contacted",   label: "Contacted",   color: "#A78BFA", dotClass: "bg-violet",  prob: 0.2 },
  { id: "Qualified",   label: "Qualified",   color: "#6366F1", dotClass: "bg-accent",  prob: 0.4 },
  { id: "Proposal",    label: "Proposal",    color: "#FB923C", dotClass: "bg-orange",  prob: 0.6 },
  { id: "Negotiation", label: "Negotiation", color: "#FB7185", dotClass: "bg-danger",  prob: 0.8 },
];

const statusBadgeConfig: Record<DealStatus, { label: string; variant: "success" | "danger" | "default" }> = {
  open:  { label: "Open",  variant: "default" },
  won:   { label: "Won",   variant: "success" },
  lost:  { label: "Lost",  variant: "danger" },
};

function fmtRp(v: number): string {
  if (v >= 1_000_000) return `Rp ${(v / 1_000_000).toFixed(1)}jt`;
  if (v >= 1_000) return `Rp ${(v / 1000).toFixed(0)}rb`;
  return `Rp ${v.toLocaleString("id-ID")}`;
}

const EMPTY_FORM = { title: "", value: "", contactId: "", expectedClose: "", notes: "" };

// ── Main Component ─────────────────────────────────────────────────────────────
export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState<{ dealId: number; fromStage: string } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchDeals = useCallback(async () => {
    try {
      const res = await fetch("/api/deals", { cache: "no-store" });
      if (!res.ok) throw new Error("Gagal ambil data deals");
      const data = await res.json();
      setDeals(data.data ?? []);
    } catch (e) {
      const err = e as Error;
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => { if (!cancelled) await fetchDeals(); };
    tick();
    const interval = setInterval(tick, 30_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [fetchDeals]);

  // ── Drag & drop stage update ──────────────────────────────────────────────
  async function onDrop(targetStage: DealStage) {
    if (!dragging) return;
    if (dragging.fromStage === targetStage) { setDragging(null); return; }
    setActionLoading(dragging.dealId);
    try {
      await fetch(`/api/deals/${dragging.dealId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: targetStage }),
      });
      await fetchDeals();
    } finally {
      setActionLoading(null);
      setDragging(null);
    }
  }

  // ── Won / Lost actions ────────────────────────────────────────────────────
  async function markStatus(id: number, status: "won" | "lost") {
    setActionLoading(id);
    try {
      await fetch(`/api/deals/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await fetchDeals();
    } finally {
      setActionLoading(null);
    }
  }

  // ── Create deal ───────────────────────────────────────────────────────────
  async function handleCreate() {
    setFormError(null);
    if (!form.title.trim()) { setFormError("Judul wajib diisi"); return; }
    const res = await fetch("/api/deals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title.trim(),
        value: Number(form.value) || 0,
        contactId: form.contactId ? Number(form.contactId) : null,
        expectedClose: form.expectedClose || null,
        notes: form.notes.trim() || null,
      }),
    });
    const data = await res.json();
    if (!res.ok) { setFormError(data.error ?? "Gagal membuat deal"); return; }
    setShowForm(false);
    setForm(EMPTY_FORM);
    await fetchDeals();
  }

  // ── Derived stats ─────────────────────────────────────────────────────────
  const openDeals = deals.filter((d) => d.status === "open");
  const pipelineValue = openDeals.reduce((s, d) => s + d.value, 0);
  const forecast = openDeals.reduce((s, d) => {
    const stageConf = STAGES.find((st) => st.id === d.stage);
    return s + d.value * (stageConf?.prob ?? 0);
  }, 0);
  const wonDeals = deals.filter((d) => d.status === "won");
  const wonValue = wonDeals.reduce((s, d) => s + d.value, 0);

  // ── Won/Lost bucket ───────────────────────────────────────────────────────
  const wonLostDeals = deals.filter((d) => d.status !== "open");

  return (
    <div>
      <PageHeader
        title="Deals"
        subtitle="Pipeline penjualan — drag & drop antar tahap"
        actions={<Button size="sm" onClick={() => setShowForm(!showForm)}>+ Tambah Deal</Button>}
      />

      {/* Summary deck */}
      <div className="mb-6 grid grid-cols-2 gap-3 rounded-xl border border-edge/60 bg-surface-2/40 px-4 py-3.5 sm:grid-cols-4 md:px-5 md:py-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Deal Aktif</span>
          <p className="text-lg font-extrabold text-slate-100">{loading ? "—" : openDeals.length}</p>
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Nilai Pipeline</span>
          <p className="text-lg font-extrabold text-accent">{loading ? "—" : fmtRp(pipelineValue)}</p>
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Forecast</span>
          <p className="text-lg font-extrabold text-slate-100">{loading ? "—" : fmtRp(forecast)}</p>
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Total Won</span>
          <p className="text-lg font-extrabold text-success">{loading ? "—" : fmtRp(wonValue)}</p>
        </div>
      </div>

      {/* New deal form */}
      {showForm && (
        <div className="mb-6 rounded-xl border border-edge/60 bg-surface-2/40 p-4">
          <p className="mb-3 text-sm font-bold text-slate-100">Deal Baru</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Input placeholder="Judul deal *" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
            </div>
            <Input placeholder="Nilai (IDR, angka saja)" value={form.value} onChange={(e) => setForm((p) => ({ ...p, value: e.target.value }))} />
            <Input placeholder="Contact ID (opsional)" value={form.contactId} onChange={(e) => setForm((p) => ({ ...p, contactId: e.target.value }))} />
            <Input type="date" placeholder="Expected close" value={form.expectedClose} onChange={(e) => setForm((p) => ({ ...p, expectedClose: e.target.value }))} />
            <Input placeholder="Catatan (opsional)" value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
          </div>
          {formError && <p className="mt-2 text-sm text-danger">{formError}</p>}
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={handleCreate}>Simpan</Button>
            <Button variant="outline" size="sm" onClick={() => { setShowForm(false); setFormError(null); }}>Batal</Button>
          </div>
        </div>
      )}

      {error && <p className="mb-4 text-sm text-danger">{error}</p>}

      {/* Kanban board */}
      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4 md:mx-0 md:grid md:grid-cols-2 md:gap-4 md:overflow-visible md:px-0 lg:grid-cols-3 2xl:grid-cols-6">
        {/* Stage columns */}
        {STAGES.map((stage) => {
          const colDeals = deals.filter((d) => d.status === "open" && d.stage === stage.id);
          return (
            <div
              key={stage.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(stage.id)}
              className={cn(
                "w-[78vw] shrink-0 snap-center rounded-xl border border-edge/60 bg-surface-2/40 p-3 transition-colors md:w-auto",
                dragging && "border-dashed border-accent/50"
              )}
            >
              <div className="mb-3 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className={cn("h-2 w-2 rounded-full", stage.dotClass)} />
                  <span className="text-sm font-bold text-slate-100">{stage.label}</span>
                </div>
                <Badge>{colDeals.length}</Badge>
              </div>
              <div className="space-y-2.5">
                {colDeals.map((deal) => (
                  <div
                    key={deal.id}
                    draggable
                    onDragStart={() => setDragging({ dealId: deal.id, fromStage: deal.stage })}
                    onDragEnd={() => setDragging(null)}
                    className="cursor-grab rounded-lg border border-edge bg-surface p-3.5 transition-shadow hover:shadow-[0_4px_16px_rgba(0,0,0,0.3)] active:cursor-grabbing"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-100">{deal.title}</p>
                      <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: stage.color }} />
                    </div>
                    <p className="mt-1 text-xs font-bold text-accent">{fmtRp(deal.value)}</p>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-faint">
                      <span>{deal.contactName ?? (deal.contactId ? `#${deal.contactId}` : "—")}</span>
                      {deal.expectedClose && <span>⏰ {deal.expectedClose}</span>}
                    </div>
                    {/* Won/Lost actions */}
                    {actionLoading === deal.id ? (
                      <p className="mt-2 text-[10px] text-muted">Memperbarui...</p>
                    ) : (
                      <div className="mt-2 flex gap-1.5">
                        <button
                          onClick={() => markStatus(deal.id, "won")}
                          className="rounded px-2 py-0.5 text-[10px] font-bold text-success ring-1 ring-success/30 hover:bg-success/10"
                        >Won</button>
                        <button
                          onClick={() => markStatus(deal.id, "lost")}
                          className="rounded px-2 py-0.5 text-[10px] font-bold text-danger ring-1 ring-danger/30 hover:bg-danger/10"
                        >Lost</button>
                      </div>
                    )}
                  </div>
                ))}
                {colDeals.length === 0 && (
                  <p className="py-6 text-center text-xs text-faint">Drop deal di sini</p>
                )}
              </div>
            </div>
          );
        })}

        {/* Won / Lost column */}
        <div className="w-[78vw] shrink-0 snap-center rounded-xl border border-edge/60 bg-surface-2/40 p-3 md:w-auto">
          <div className="mb-3 flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-success" />
              <span className="text-sm font-bold text-slate-100">Won / Lost</span>
            </div>
            <Badge>{wonLostDeals.length}</Badge>
          </div>
          <div className="space-y-2.5">
            {wonLostDeals.map((deal) => (
              <div key={deal.id} className="rounded-lg border border-edge bg-surface p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-100">{deal.title}</p>
                  <Badge variant={statusBadgeConfig[deal.status].variant}>
                    {statusBadgeConfig[deal.status].label}
                  </Badge>
                </div>
                <p className="mt-1 text-xs font-bold text-accent">{fmtRp(deal.value)}</p>
                <p className="mt-1 text-[10px] text-faint">
                  {deal.contactName ?? (deal.contactId ? `#${deal.contactId}` : "—")}
                </p>
                {deal.lostReason && <p className="mt-1 text-[10px] text-muted italic">{deal.lostReason}</p>}
              </div>
            ))}
            {wonLostDeals.length === 0 && (
              <p className="py-6 text-center text-xs text-faint">Belum ada deal selesai</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
