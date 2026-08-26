"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/ui/data-table";
import { timeAgo } from "@/lib/utils";

// ⚠️ Prototipe statis Phase 0 — AI CS (mina-cs) belum nyambung.
// Phase 2: koneksi MCP ke mina-cs di VPS + log dari DB ai_conversations.

// Log percakapan AI (dari DB ai_conversations — dummy)
const aiLogs = [
  { id: 1, contact: "Yan Azmi", request: "Untuk harga paketnya berapa ya?", response: "Halo kak! Untuk paket kami: Basic 150rb, Pro 350rb, Pro Max 750rb/bulan. Mau dibantu pilih yang sesuai?", matched: "Rules & SOP", time: 1786651545 },
  { id: 2, contact: "Evi Yuslatin", request: "Bisa kirim brosur dong", response: "Tentu kak, brosur digital kami kirim via email atau WA ya — boleh minta alamat emailnya?", matched: "Rules & SOP", time: 1786639240 },
  { id: 3, contact: "Fajar Servis", request: "Jam buka di mana?", response: "Kami buka Senin–Jumat 08.00–17.00 WIB. Alamat: Jl. Contoh No. 123, Jakarta.", matched: "Fast-path rule (alamat)", time: 1786558332 },
];

export default function AutomationPage() {
  const [rulesList, setRulesList] = useState([
    { id: 1, keyword: "harga", reply: "Untuk info harga paket, bisa dibantu kak: Basic 150rb, Pro 350rb, Pro Max 750rb/bulan.", enabled: true, hits: 42 },
    { id: 2, keyword: "alamat", reply: "Alamat kami: Jl. Contoh No. 123, Jakarta. Buka Senin-Jumat 08.00-17.00.", enabled: true, hits: 18 },
    { id: 3, keyword: "cara bayar", reply: "Pembayaran via transfer bank / QRIS. Detailnya dikirim ke WA ya kak.", enabled: true, hits: 27 },
    { id: 4, keyword: "refund", reply: "Untuk refund, hubungi admin langsung ya — kami proses maksimal 1x24 jam.", enabled: false, hits: 5 },
  ]);
  const [form, setForm] = useState({ keyword: "", reply: "" });
  const [tab, setTab] = useState<"ai" | "rules">("ai");

  const aiStatus = { enabled: true, profile: "mina-cs (Hermes di VPS)", cooldown: 30, businessHours: "08:00–20:00 WIB" };

  const cols: Column<(typeof rulesList)[number]>[] = [
    { key: "keyword", header: "Keyword", render: (r) => <Badge variant="info">{`"${r.keyword}"`}</Badge> },
    { key: "reply", header: "Balasan Cepat", render: (r) => <span className="line-clamp-2 max-w-md text-xs text-muted">{r.reply}</span> },
    { key: "hits", header: "Dipicu", render: (r) => <span className="font-bold text-slate-100">{r.hits}x</span> },
    { key: "enabled", header: "Status", render: (r) => (r.enabled ? <Badge variant="success">Aktif</Badge> : <Badge variant="default">Nonaktif</Badge>) },
    {
      key: "actions", header: "Aksi", className: "text-right",
      render: (r) => (
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setRulesList((l) => l.map((x) => (x.id === r.id ? { ...x, enabled: !x.enabled } : x)))}>
            {r.enabled ? "Nonaktifkan" : "Aktifkan"}
          </Button>
          <Button variant="danger" size="sm">Hapus</Button>
        </div>
      ),
    },
  ];

  const logCols: Column<(typeof aiLogs)[number]>[] = [
    { key: "contact", header: "Kontak", render: (l) => <span className="font-semibold text-slate-100">{l.contact}</span> },
    { key: "request", header: "Pesan Masuk", render: (l) => <span className="line-clamp-1 max-w-[220px] text-xs text-muted">{`"${l.request}"`}</span> },
    { key: "response", header: "Jawaban AI (mina-cs)", render: (l) => <span className="line-clamp-2 max-w-md text-xs text-slate-300">{l.response}</span> },
    { key: "matched", header: "Sumber Jawaban", render: (l) => <Badge variant={l.matched.startsWith("Fast-path") ? "violet" : "info"}>{l.matched}</Badge> },
    { key: "time", header: "Waktu", render: (l) => <span className="whitespace-nowrap text-xs text-faint">{timeAgo(l.time)}</span> },
  ];

  return (
    <div>
      <PageHeader
        title="Automation"
        subtitle="AI CS (mina-cs) — balas chat sesuai Rules & SOP saat lo sibuk"
        actions={<Badge variant={aiStatus.enabled ? "success" : "default"}>{aiStatus.enabled ? "● AI CS Aktif" : "○ Nonaktif"}</Badge>}
      />

      {/* Status AI CS — mobile: 2 kolom, desktop: 4 */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <Card>
          <div className="p-5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Otak AI CS</p>
            <p className="mt-1 text-sm font-bold text-slate-100">mina-cs</p>
            <p className="mt-1 text-[11px] text-faint">Profile Hermes di VPS — jawab sesuai SOP, bukan keyword statis</p>
          </div>
        </Card>
        <Card>
          <div className="p-5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Cooldown Anti-Spam</p>
            <p className="mt-1 text-sm font-bold text-slate-100">{aiStatus.cooldown} menit / kontak</p>
            <p className="mt-1 text-[11px] text-faint">Setelah di-auto-reply, pesan berikutnya diam — biar manusia yang handle</p>
          </div>
        </Card>
        <Card>
          <div className="p-5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Jam Aktif</p>
            <p className="mt-1 text-sm font-bold text-slate-100">{aiStatus.businessHours}</p>
            <p className="mt-1 text-[11px] text-faint">Di luar jam → fallback ke manusia</p>
          </div>
        </Card>
        <Card>
          <div className="p-5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Akses Data CRM</p>
            <p className="mt-1 text-sm font-bold text-slate-100">Read-only 👁</p>
            <p className="mt-1 text-[11px] text-faint">Bisa baca kontak & deal buat personalisasi — gak bisa edit. Semua akses di-log</p>
          </div>
        </Card>
      </div>

      {/* Tab: Log AI CS (utama) vs Keyword Rules (opsional fast-path) */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setTab("ai")}
          className={`rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${tab === "ai" ? "bg-accent text-[#0B0E14]" : "border border-edge text-muted hover:text-slate-200"}`}
        >
          Percakapan AI CS
        </button>
        <button
          onClick={() => setTab("rules")}
          className={`rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${tab === "rules" ? "bg-accent text-[#0B0E14]" : "border border-edge text-muted hover:text-slate-200"}`}
        >
          Keyword Rules (Opsional)
        </button>
      </div>

      {tab === "ai" ? (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-edge/60 px-5 py-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100">Log Percakapan AI</h3>
              <p className="mt-0.5 text-xs text-muted">Semua percakapan di-log buat review & perbaikan SOP</p>
            </div>
            <Badge variant="info">{aiLogs.length} percakapan hari ini</Badge>
          </div>
          <DataTable columns={logCols} rows={aiLogs} emptyText="Belum ada percakapan AI" />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          {/* Form tambah rule */}
          <Card className="h-fit">
            <div className="border-b border-edge/60 px-5 py-4">
              <h3 className="text-sm font-bold text-slate-100">+ Tambah Keyword Rule</h3>
              <p className="mt-0.5 text-xs text-muted">Fast-path opsional — pesan yang match keyword dibalas instan tanpa AI</p>
            </div>
            <div className="space-y-4 p-5">
              <div>
                <Label>Keyword</Label>
                <Input placeholder="cth: harga" value={form.keyword} onChange={(e) => setForm({ ...form, keyword: e.target.value })} />
              </div>
              <div>
                <Label>Balasan Otomatis</Label>
                <textarea
                  className="min-h-24 w-full rounded-lg border border-edge bg-surface-2 px-3 py-2 text-sm text-slate-100 placeholder:text-faint focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/40"
                  placeholder="Tulis balasan... (opsional — AI tetap jadi intelijen utama)"
                  value={form.reply}
                  onChange={(e) => setForm({ ...form, reply: e.target.value })}
                />
              </div>
              <Button
                className="w-full"
                onClick={() => {
                  if (!form.keyword.trim() || !form.reply.trim()) return;
                  setRulesList((l) => [...l, { id: Date.now(), keyword: form.keyword.trim(), reply: form.reply.trim(), enabled: true, hits: 0 }]);
                  setForm({ keyword: "", reply: "" });
                }}
              >
                Simpan Rule
              </Button>
            </div>
          </Card>

          {/* Daftar rules */}
          <Card className="xl:col-span-2">
            <div className="border-b border-edge/60 px-5 py-4">
              <h3 className="text-sm font-bold text-slate-100">Keyword Rules</h3>
              <p className="mt-0.5 text-xs text-muted">{rulesList.length} aturan terdaftar — fast-path opsional, AI tetap utama</p>
            </div>
            <DataTable columns={cols} rows={rulesList} emptyText="Belum ada rule" />
          </Card>
        </div>
      )}
    </div>
  );
}