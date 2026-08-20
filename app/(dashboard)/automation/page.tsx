"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/ui/data-table";

const rules = [
  { id: 1, keyword: "harga", reply: "Untuk info harga paket, bisa dibantu kak: Basic 150rb, Pro 350rb, Pro Max 750rb/bulan.", enabled: true, hits: 42 },
  { id: 2, keyword: "alamat", reply: "Alamat kami: Jl. Contoh No. 123, Jakarta. Buka Senin-Jumat 08.00-17.00.", enabled: true, hits: 18 },
  { id: 3, keyword: "cara bayar", reply: "Pembayaran via transfer bank / QRIS. Detailnya dikirim ke WA ya kak.", enabled: true, hits: 27 },
  { id: 4, keyword: "refund", reply: "Untuk refund, hubungi admin langsung ya — kami proses maksimal 1x24 jam.", enabled: false, hits: 5 },
];

const autoReply = {
  enabled: true,
  businessHours: true,
  startHour: "08:00",
  endHour: "20:00",
  fallback: "Terima kasih sudah menghubungi kami! Admin akan segera balas di jam kerja (08.00-20.00).",
};

export default function AutomationPage() {
  const [rulesList, setRulesList] = useState(rules);
  const [form, setForm] = useState({ keyword: "", reply: "" });

  const cols: Column<(typeof rules)[number]>[] = [
    { key: "keyword", header: "Keyword", render: (r) => <Badge variant="info">&quot;{r.keyword}&quot;</Badge> },
    { key: "reply", header: "Balasan Otomatis", render: (r) => <span className="line-clamp-2 max-w-md text-xs text-muted">{r.reply}</span> },
    { key: "hits", header: "Dipicu", render: (r) => <span className="font-bold text-slate-100">{r.hits}x</span> },
    {
      key: "enabled",
      header: "Status",
      render: (r) => (r.enabled ? <Badge variant="success">Aktif</Badge> : <Badge variant="default">Nonaktif</Badge>),
    },
    {
      key: "actions",
      header: "Aksi",
      className: "text-right",
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

  return (
    <div>
      <PageHeader
        title="Automation"
        subtitle="Auto-reply + keyword trigger — balas otomatis di jam kerja"
        actions={<Badge variant={autoReply.enabled ? "success" : "default"}>{autoReply.enabled ? "● Auto-reply Aktif" : "○ Nonaktif"}</Badge>}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Form tambah rule */}
        <Card className="h-fit">
          <div className="border-b border-edge/60 px-5 py-4">
            <h3 className="text-sm font-bold text-slate-100">+ Tambah Keyword Rule</h3>
            <p className="mt-0.5 text-xs text-muted">Pesan masuk yang mengandung keyword → balas otomatis</p>
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
                placeholder="Tulis balasan..."
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
            <p className="mt-0.5 text-xs text-muted">{rulesList.length} aturan terdaftar</p>
          </div>
          <DataTable columns={cols} rows={rulesList} emptyText="Belum ada rule" />
        </Card>
      </div>

      {/* Auto-reply settings */}
      <Card className="mt-4">
        <div className="border-b border-edge/60 px-5 py-4">
          <h3 className="text-sm font-bold text-slate-100">Pengaturan Auto-Reply</h3>
        </div>
        <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-3">
          <div className="rounded-lg border border-edge/60 bg-surface-2/50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Jam Kerja</p>
            <p className="mt-1 text-sm font-bold text-slate-100">
              {autoReply.startHour} – {autoReply.endHour}
            </p>
            <p className="mt-1 text-xs text-faint">Di luar jam → pesan ditunda</p>
          </div>
          <div className="rounded-lg border border-edge/60 bg-surface-2/50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Pesan Default</p>
            <p className="mt-1 line-clamp-2 text-xs text-slate-300">{autoReply.fallback}</p>
          </div>
          <div className="rounded-lg border border-edge/60 bg-surface-2/50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Mode</p>
            <Badge variant="success" className="mt-1">Auto-reply aktif</Badge>
            <p className="mt-1 text-xs text-faint">Jawab otomatis di jam kerja</p>
          </div>
        </div>
      </Card>
    </div>
  );
}