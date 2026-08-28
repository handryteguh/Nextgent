"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/ui/data-table";
import { cn, timeAgo } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────────
type Rule = {
  id: number;
  keyword: string;
  reply: string;
  enabled: boolean;
  hits: number;
  createdAt: number;
};

type AiLog = {
  id: number;
  contactName: string | null;
  phone: string | null;
  request: string;
  response: string;
  matched: string;
  createdAt: number;
};

type Tab = "ai" | "rules" | "sequences";

// ── Main ───────────────────────────────────────────────────────────────────────
export default function AutomationPage() {
  const [tab, setTab] = useState<Tab>("ai");
  const [rules, setRules] = useState<Rule[]>([]);
  const [aiLogs, setAiLogs] = useState<AiLog[]>([]);
  const [form, setForm] = useState({ keyword: "", reply: "" });
  const [saving, setSaving] = useState(false);
  const [loadingRules, setLoadingRules] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);

  // ── Fetch rules ─────────────────────────────────────────────────────────────
  const fetchRules = useCallback(async () => {
    const res = await fetch("/api/automation/rules", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setRules(data.data ?? []);
    }
    setLoadingRules(false);
  }, []);

  // ── Fetch AI logs ────────────────────────────────────────────────────────────
  const fetchLogs = useCallback(async () => {
    const res = await fetch("/api/automation/ai-logs", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setAiLogs(data.data ?? []);
    }
    setLoadingLogs(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      if (cancelled) return;
      await Promise.all([fetchRules(), fetchLogs()]);
    };
    void tick();
    const interval = setInterval(() => { void tick(); }, 30_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [fetchRules, fetchLogs]);

  // ── Add rule ────────────────────────────────────────────────────────────────
  async function handleAddRule() {
    if (!form.keyword.trim() || !form.reply.trim() || saving) return;
    setSaving(true);
    try {
      await fetch("/api/automation/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: form.keyword.trim(), reply: form.reply.trim() }),
      });
      setForm({ keyword: "", reply: "" });
      await fetchRules();
    } finally {
      setSaving(false);
    }
  }

  // ── Toggle rule ─────────────────────────────────────────────────────────────
  async function handleToggle(id: number, enabled: boolean) {
    await fetch(`/api/automation/rules/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !enabled }),
    });
    await fetchRules();
  }

  // ── Delete rule ─────────────────────────────────────────────────────────────
  async function handleDelete(id: number) {
    await fetch(`/api/automation/rules/${id}`, { method: "DELETE" });
    await fetchRules();
  }

  // ── Rule columns ────────────────────────────────────────────────────────────
  const ruleCols: Column<Rule>[] = [
    {
      key: "keyword",
      header: "Keyword",
      render: (r) => <Badge variant="info">{`"${r.keyword}"`}</Badge>,
    },
    {
      key: "reply",
      header: "Balasan Cepat",
      render: (r) => <span className="line-clamp-2 max-w-md text-xs text-muted">{r.reply}</span>,
    },
    {
      key: "hits",
      header: "Dipicu",
      render: (r) => <span className="text-xs font-bold text-slate-300">{r.hits}×</span>,
    },
    {
      key: "enabled",
      header: "Status",
      render: (r) => (
        <button onClick={() => { void handleToggle(r.id, r.enabled); }}>
          <Badge variant={r.enabled ? "success" : "default"}>
            {r.enabled ? "Aktif" : "Nonaktif"}
          </Badge>
        </button>
      ),
    },
    {
      key: "id",
      header: "",
      render: (r) => (
        <button
          onClick={() => { void handleDelete(r.id); }}
          className="text-xs font-semibold text-danger hover:underline"
        >
          Hapus
        </button>
      ),
    },
  ];

  // ── AI log columns ──────────────────────────────────────────────────────────
  const logCols: Column<AiLog>[] = [
    {
      key: "contactName",
      header: "Kontak",
      render: (r) => (
        <div>
          <p className="text-xs font-semibold text-slate-200">{r.contactName ?? "—"}</p>
          {r.phone && <p className="text-[10px] text-faint">{r.phone}</p>}
        </div>
      ),
    },
    {
      key: "request",
      header: "Pesan Masuk",
      render: (r) => <span className="line-clamp-2 max-w-xs text-xs text-muted">{r.request}</span>,
    },
    {
      key: "response",
      header: "Balasan AI",
      render: (r) => <span className="line-clamp-2 max-w-xs text-xs text-muted">{r.response}</span>,
    },
    {
      key: "matched",
      header: "Matched",
      render: (r) => <Badge variant="info">{r.matched}</Badge>,
    },
    {
      key: "createdAt",
      header: "Waktu",
      render: (r) => <span className="text-[10px] text-faint">{timeAgo(r.createdAt)}</span>,
    },
  ];

  // ── AI status card (Hermes VPS) ─────────────────────────────────────────────
  const aiStatus = {
    profile: "Hermes Agent (VPS)",
    bridge: process.env.NEXT_PUBLIC_HERMES_VPS_URL ? "Terhubung" : "Belum diset",
    businessHours: "08:00–20:00 WIB",
    cooldown: 30,
  };

  return (
    <div>
      <PageHeader
        title="Automation"
        subtitle="AI CS + keyword rules + sequence triggers"
        actions={
          <div className="flex gap-1 rounded-full border border-edge p-1">
            {(["ai", "rules", "sequences"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "rounded-full px-3 py-1 text-[11px] font-bold capitalize transition-colors",
                  tab === t ? "bg-accent text-[#0B0E14]" : "text-muted hover:text-slate-200"
                )}
              >
                {t === "ai" ? "AI CS" : t === "rules" ? "Keyword Rules" : "Sequences"}
              </button>
            ))}
          </div>
        }
      />

      {/* ── Tab: AI CS ─────────────────────────────────────────────────────── */}
      {tab === "ai" && (
        <div className="space-y-4">
          {/* Status card */}
          <Card>
            <CardHeader title="Status AI CS" subtitle="Hermes Agent di VPS — auto-balas pesan masuk" />
            <CardBody>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {[
                  { label: "Engine", value: aiStatus.profile, color: "text-accent" },
                  { label: "Bridge WA", value: aiStatus.bridge, color: "text-info" },
                  { label: "Jam Operasi", value: aiStatus.businessHours, color: "text-slate-200" },
                  { label: "Cooldown", value: `${aiStatus.cooldown}s`, color: "text-slate-200" },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg border border-edge/60 bg-surface-2/50 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-faint">{item.label}</p>
                    <p className={cn("mt-1 text-sm font-bold", item.color)}>{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-lg border border-info/30 bg-info/10 p-4">
                <p className="text-sm font-semibold text-info">💡 Cara kerja AI CS</p>
                <ol className="mt-2 space-y-1 text-xs text-muted">
                  <li>1. Pesan masuk via bridge WA → <code className="text-accent">/api/webhook/wa</code></li>
                  <li>2. Cek keyword rules dulu (fast-path) — kalau match, langsung balas</li>
                  <li>3. Kalau gak ada rule yang cocok → forward ke Hermes Agent di VPS</li>
                  <li>4. Hermes generate balasan berdasarkan SOP + konteks kontak</li>
                  <li>5. Balasan dikirim via <code className="text-accent">/api/wa/send</code> → log masuk ke tabel ini</li>
                </ol>
              </div>
            </CardBody>
          </Card>

          {/* AI logs */}
          <Card>
            <CardHeader
              title="Log Percakapan AI"
              subtitle={`${aiLogs.length} percakapan terakhir`}
            />
            {loadingLogs ? (
              <p className="px-5 py-8 text-center text-sm text-muted">Memuat...</p>
            ) : aiLogs.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-sm text-muted">Belum ada log AI CS</p>
                <p className="mt-1 text-xs text-faint">Log akan muncul setelah bridge WA terhubung dan AI mulai membalas</p>
              </div>
            ) : (
              <DataTable columns={logCols} rows={aiLogs} emptyText="Belum ada log" />
            )}
          </Card>
        </div>
      )}

      {/* ── Tab: Keyword Rules ──────────────────────────────────────────────── */}
      {tab === "rules" && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          {/* Form tambah rule */}
          <Card className="xl:col-span-1">
            <CardHeader title="Tambah Rule" subtitle="Keyword → balasan otomatis (fast-path sebelum AI)" />
            <CardBody className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted">Keyword</label>
                <Input
                  placeholder="contoh: harga, alamat, cara bayar"
                  value={form.keyword}
                  onChange={(e) => setForm((f) => ({ ...f, keyword: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted">Balasan otomatis</label>
                <textarea
                  placeholder="Tulis balasan yang akan dikirim otomatis..."
                  value={form.reply}
                  onChange={(e) => setForm((f) => ({ ...f, reply: e.target.value }))}
                  rows={4}
                  className="w-full resize-none rounded-lg border border-edge bg-surface-2 px-3 py-2 text-sm text-slate-200 placeholder:text-faint focus:border-accent focus:outline-none"
                />
              </div>
              <Button
                disabled={!form.keyword.trim() || !form.reply.trim() || saving}
                onClick={() => { void handleAddRule(); }}
                className="w-full"
              >
                {saving ? "Menyimpan..." : "Simpan Rule"}
              </Button>
              <p className="text-[10px] text-faint">
                Tip: keyword gak case-sensitive. Gunakan kata kunci pendek (1–3 kata) biar akurasi deteksi tinggi.
              </p>
            </CardBody>
          </Card>

          {/* Daftar rules */}
          <Card className="xl:col-span-2">
            <CardHeader
              title="Keyword Rules"
              subtitle={loadingRules ? "Memuat..." : `${rules.length} aturan — klik status untuk toggle, klik Hapus untuk hapus`}
            />
            {loadingRules ? (
              <p className="px-5 py-8 text-center text-sm text-muted">Memuat...</p>
            ) : (
              <DataTable columns={ruleCols} rows={rules} emptyText="Belum ada rule — tambah di kiri" />
            )}
          </Card>
        </div>
      )}

      {/* ── Tab: Sequences ─────────────────────────────────────────────────── */}
      {tab === "sequences" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-accent/20 bg-accent/5 p-5">
            <p className="text-sm font-bold text-accent">📋 Sequences dikelola di halaman Follow-up</p>
            <p className="mt-1 text-xs text-muted">
              Buat dan kelola sequence FU1 → FU2 → FU3 langsung dari menu Follow-up di sidebar.
              Di sini kamu bisa lihat trigger dan status semua sequence yang aktif.
            </p>
            <a
              href="/followup"
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-xs font-bold text-[#0B0E14] hover:bg-accent-hover"
            >
              Buka Follow-up →
            </a>
          </div>

          {/* Placeholder sequence trigger config */}
          <Card>
            <CardHeader
              title="Trigger Config"
              subtitle="Kapan sequence otomatis dimulai untuk kontak baru"
            />
            <CardBody className="space-y-3">
              {[
                { trigger: "Kontak baru masuk via chat", action: "Mulai Sequence Default", status: "soon" },
                { trigger: "Kontak balas pesan", action: "Stop FU aktif, tandai sebagai Respond", status: "soon" },
                { trigger: "Kata kunci 'stop' / 'berhenti'", action: "Unsubscribe permanen", status: "soon" },
                { trigger: "Deal stage → Won", action: "Stop semua FU kontak", status: "soon" },
              ].map((item) => (
                <div key={item.trigger} className="flex items-center justify-between rounded-lg border border-edge/60 bg-surface-2/50 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-200">Trigger: <span className="text-info">{item.trigger}</span></p>
                    <p className="text-xs text-muted">→ {item.action}</p>
                  </div>
                  <Badge variant="warning">Soon</Badge>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
