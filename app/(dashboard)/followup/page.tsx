"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/ui/data-table";
import { KpiCard } from "@/components/ui/kpi-card";

// Data dummy sequence
const sequence = [
  { id: "fu1", name: "FU1", delay: "H+1 (24 jam)", template: "Halo {nama}, makasih udah hubungi kami. Ada yang bisa kami bantu soal {topik}?" },
  { id: "fu2", name: "FU2", delay: "H+3 (72 jam)", template: "Halo {nama}, follow-up nih — gimana {topik}? Kami bisa bantu kalau masih butuh." },
  { id: "fu3", name: "FU3", delay: "H+7 (168 jam)", template: "Halo {nama}, ini follow-up terakhir dari kami soal {topik}. Kabarin aja kalau masih minat ya." },
];

// Data dummy progress — status sesuai PRD 5.4.6 (lengkap)
const progress = [
  { id: 1, name: "Yan Azmi", step: "Menunggu FU1", due: "20 Agu, 09:00", status: "active" as const, replied: false },
  { id: 2, name: "Johar Tantowi", step: "FU1 terkirim", due: "18 Agu, 09:00", status: "info" as const, replied: false },
  { id: 3, name: "Evi Yuslatin", step: "FU2 terkirim", due: "15 Agu, 10:12", status: "violet" as const, replied: false },
  { id: 4, name: "Prasetyo Darmawan", step: "Balas — STOP", due: "—", status: "success" as const, replied: true },
  { id: 5, name: "Maya Jaya", step: "Selesai", due: "—", status: "success" as const, replied: true },
  { id: 6, name: "Fajar Servis", step: "FU1 terkirim", due: "10 Agu, 08:45", status: "info" as const, replied: false },
  { id: 7, name: "Ranti Mebel", step: "Unsubscribe", due: "—", status: "danger" as const, replied: false },
  { id: 8, name: "Ari Studio", step: "Paused (WA putus)", due: "—", status: "warning" as const, replied: false },
  { id: 9, name: "Budi Santoso", step: "Gagal — retry habis", due: "—", status: "danger" as const, replied: false },
];

export default function FollowupPage() {
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "FU2", delay: "72", template: "" });

  const cols: Column<(typeof progress)[number]>[] = [
    { key: "name", header: "Kontak", render: (r) => <span className="font-semibold text-slate-100">{r.name}</span> },
    { key: "step", header: "Status", render: (r) => (
      <Badge variant={r.status === "active" ? "warning" : r.status}>{r.step}</Badge>
    ) },
    { key: "due", header: "Jadwal Berikutnya", render: (r) => <span className={r.due === "—" ? "text-faint" : "text-slate-300"}>{r.due}</span> },
    { key: "replied", header: "Balasan", render: (r) => (r.replied ? <Badge variant="success">✔ Dibalas</Badge> : <span className="text-faint">—</span>) },
    {
      key: "actions",
      header: "Aksi",
      className: "text-right",
      render: () => (
        <div className="flex justify-end gap-1.5">
          <Button variant="outline" size="sm" title="Lanjut ke step berikutnya">Lewati</Button>
          <Button variant="outline" size="sm" title="Tunda jadwal">Tunda</Button>
          <Button variant="danger" size="sm" title="Hentikan sequence">Stop</Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Follow-up"
        subtitle="⭐ Mesin follow-up otomatis FU1 → FU2 → FU3 — stop on reply"
        actions={<Button size="sm">+ Tambah Sequence</Button>}
      />

      {/* Stats — mobile: 2 kolom */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-4">
        <KpiCard label="Dalam Sequence" value={314} sub="Sedang berjalan" color="accent" icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>} />
        <KpiCard label="Response Rate" value="68%" sub="Rata-rata semua step" color="success" icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        <KpiCard label="Anti-Banned" value="On" sub="Jam 08-20 · delay ±20%" color="info" icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>} />
        <KpiCard label="Hari Ini Terkirim" value="23" sub="FU1: 9 · FU2: 8 · FU3: 6" color="violet" icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
      </div>

      {/* Sequence editor & list — mobile: stack, desktop: 1/3 + 2/3 */}
      <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader title={editId ? "Edit Step" : "+ Tambah Step"} subtitle="Atur jeda & template pesan" />
          <CardBody className="space-y-4">
            <div>
              <Label>Nama Step</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Delay (jam)</Label>
                <Input type="number" value={form.delay} onChange={(e) => setForm({ ...form, delay: e.target.value })} />
              </div>
              <div>
                <Label>Trigger</Label>
                <Select defaultValue="new_contact">
                  <option value="new_contact">Kontak Baru</option>
                  <option value="deal_stage">Deal Stage</option>
                  <option value="manual">Manual</option>
                </Select>
              </div>
            </div>
            <div>
              <Label>Template Pesan</Label>
              <textarea
                className="min-h-24 w-full rounded-lg border border-edge bg-surface-2 px-3 py-2 text-sm text-slate-100 placeholder:text-faint focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/40"
                placeholder="Halo {nama}, ..."
                value={form.template}
                onChange={(e) => setForm({ ...form, template: e.target.value })}
              />
              <p className="mt-1 text-[10px] text-faint">
                Variabel: {"{nama}"} {"{topik}"} — delay random ±20% otomatis
              </p>
            </div>
            <div className="flex gap-2">
              <Button className="flex-1">Simpan Step</Button>
              {editId && <Button variant="outline" onClick={() => setEditId(null)}>Batal</Button>}
            </div>
          </CardBody>
        </Card>

        {/* Sequence list */}
        <Card className="xl:col-span-2">
          <CardHeader title="Sequence Default — Sales Cadence" subtitle="Urutan follow-up otomatis (3 step)" />
          <CardBody className="space-y-3">
            {sequence.map((s, i) => (
              <div key={s.id} className="flex items-start gap-4 rounded-lg border border-edge/60 bg-surface-2/50 p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 font-extrabold text-accent">
                  {i + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-slate-100">{s.name}</span>
                    <Badge variant="info">{s.delay}</Badge>
                  </div>
                  <p className="mt-1.5 truncate text-xs text-muted">{s.template}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setEditId(s.id); setForm({ name: s.name, delay: String(parseInt(s.delay)), template: s.template }); }}>
                    Edit
                  </Button>
                  <Button variant="danger" size="sm">Hapus</Button>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between rounded-lg border border-success/25 bg-success/5 p-3 text-xs">
              <span className="flex items-center gap-2 font-semibold text-success">
                <span className="h-2 w-2 rounded-full bg-success" /> Safety Engine Aktif
              </span>
              <span className="text-muted">08:00–20:00 · delay ±20% · max 1/hari · unsubscribe-aware</span>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Progress table */}
      <Card>
        <CardHeader title="Progress Follow-up" subtitle="Status tiap kontak dalam sequence" />
        <DataTable columns={cols} rows={progress} emptyText="Belum ada kontak dalam sequence" />
      </Card>
    </div>
  );
}