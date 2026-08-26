"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FilterPills } from "@/components/ui/filter-pills";
import { DataTable, type Column } from "@/components/ui/data-table";
import { KpiCard } from "@/components/ui/kpi-card";
import { fmtDate } from "@/lib/utils";

// Data dummy kontak (Phase 0) — status lead/customer + topic {topik} (v0.4.1)
const contacts = [
  { id: 1, name: "Yan Azmi", email: "yanazmi@gmail.com", wa: "628123456001", role: "lead" as const, topic: "Paket Pro toko online", status: "Menunggu FU1", source: "WA", joined: "2026-08-19" },
  { id: 2, name: "Johar Tantowi", email: "ramevision@gmail.com", wa: "628123456002", role: "lead" as const, topic: "Paket basic", status: "FU1 terkirim", source: "WA", joined: "2026-08-17" },
  { id: 3, name: "Evi Yuslatin", email: "eviyuslatin@gmail.com", wa: "628123456003", role: "customer" as const, topic: "Perpanjangan Pro Max", status: "FU2 terkirim", source: "Import", joined: "2026-08-12" },
  { id: 4, name: "Prasetyo Darmawan", email: "prasetyobekt82@gmail.com", wa: "628123456004", role: "customer" as const, topic: "Basic UMKM", status: "Balas", source: "WA", joined: "2026-08-11" },
  { id: 5, name: "Maya Jaya", email: "mayajaya@gmail.com", wa: "628123456005", role: "lead" as const, topic: "", status: "Selesai", source: "Manual", joined: "2026-08-10" },
  { id: 6, name: "Fajar Servis", email: "fajarservis@gmail.com", wa: "628123456006", role: "lead" as const, topic: "Basic Bengkel", status: "Menunggu FU1", source: "WA", joined: "2026-08-09" },
  { id: 7, name: "Ranti Mebel", email: "rantimebel@gmail.com", wa: "628123456007", role: "lead" as const, topic: "Pro Max Mebel", status: "Unsubscribe", source: "WA", joined: "2026-08-05" },
  { id: 8, name: "Ari Studio", email: "aristudio@gmail.com", wa: "628123456008", role: "lead" as const, topic: "", status: "FU3 terkirim", source: "Import", joined: "2026-08-02" },
];

const statusVariant: Record<string, "default" | "success" | "danger" | "warning" | "info" | "violet"> = {
  "Menunggu FU1": "warning",
  "FU1 terkirim": "info",
  "FU2 terkirim": "violet",
  "FU3 terkirim": "violet",
  "Balas": "success",
  "Selesai": "success",
  "Unsubscribe": "danger",
};

export default function ContactsPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("semua");

  const pills = [
    { key: "semua", label: "Semua", count: contacts.length },
    { key: "menunggu", label: "Menunggu", count: contacts.filter((c) => c.status.startsWith("Menunggu")).length },
    { key: "aktif", label: "Aktif", count: contacts.filter((c) => !["Selesai", "Unsubscribe"].includes(c.status)).length },
    { key: "selesai", label: "Selesai", count: contacts.filter((c) => c.status === "Selesai").length },
    { key: "unsub", label: "Unsubscribe", count: contacts.filter((c) => c.status === "Unsubscribe").length },
  ];

  const filtered = contacts.filter((c) => {
    const q = query.toLowerCase();
    const matchQuery = !q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.wa.includes(q);
    const matchFilter =
      filter === "semua" ||
      (filter === "menunggu" && c.status.startsWith("Menunggu")) ||
      (filter === "aktif" && !["Selesai", "Unsubscribe"].includes(c.status)) ||
      (filter === "selesai" && c.status === "Selesai") ||
      (filter === "unsub" && c.status === "Unsubscribe");
    return matchQuery && matchFilter;
  });

  const cols: Column<(typeof contacts)[number]>[] = [
    { key: "name", header: "Nama" },
    { key: "wa", header: "WA" },
    {
      key: "role",
      header: "Tipe",
      render: (c) => (c.role === "customer" ? <Badge variant="success">Customer</Badge> : <Badge variant="info">Lead</Badge>),
    },
    { key: "topic", header: "Topik", render: (c) => <span className={c.topic ? "text-slate-300" : "text-faint"}>{"{topik}"}{c.topic ? `: ${c.topic}` : " (kosong)"}</span> },
    { key: "status", header: "Status FU", render: (c) => <Badge variant={statusVariant[c.status] ?? "default"}>{c.status}</Badge> },
    { key: "source", header: "Sumber", render: (c) => <span className="text-faint">{c.source}</span> },
    { key: "joined", header: "Masuk", render: (c) => <span className="text-faint">{fmtDate(c.joined)}</span> },
    {
      key: "actions",
      header: "Aksi",
      className: "text-right",
      render: () => (
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm">Chat</Button>
          <Button variant="danger" size="sm">Hapus</Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Contacts"
        subtitle="Kelola kontak & leads — auto-follow-up berjalan otomatis"
        actions={<Button size="sm">+ Tambah Kontak</Button>}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <KpiCard
          label="Total Kontak"
          value={contacts.length}
          sub="Semua sumber"
          color="accent"
          icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
        />
        <KpiCard
          label="Belum Dibales"
          value={contacts.filter((c) => c.status.startsWith("FU") || c.status.startsWith("Menunggu")).length}
          sub="Perlu follow-up"
          color="orange"
          icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-edge/60 px-5 py-4">
          <FilterPills pills={pills} active={filter} onChange={setFilter} />
          <div className="w-full sm:w-64">
            <Input
              placeholder="Cari nama, email, atau WA..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
        <DataTable columns={cols} rows={filtered} emptyText="Kontak tidak ditemukan" />
      </Card>
    </div>
  );
}