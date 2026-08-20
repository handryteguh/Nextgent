"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FilterPills } from "@/components/ui/filter-pills";
import { DataTable, type Column } from "@/components/ui/data-table";

const tasks = [
  { id: 1, title: "Follow-up manual Budi (deal Pro)", contact: "Budi Santoso", due: "Hari ini", priority: "Tinggi", status: "open" as const },
  { id: 2, title: "Kirim proposal ke Ranti Mebel", contact: "Ranti Mebel", due: "Besok", priority: "Tinggi", status: "open" as const },
  { id: 3, title: "Update harga paket di template", contact: "—", due: "22 Agu", priority: "Sedang", status: "open" as const },
  { id: 4, title: "Telpon follow-up Fajar Servis", contact: "Fajar Servis", due: "Kemarin", priority: "Tinggi", status: "overdue" as const },
  { id: 5, title: "Input leads baru dari WA", contact: "—", due: "19 Agu", priority: "Rendah", status: "done" as const },
  { id: 6, title: "Siapkan laporan mingguan", contact: "—", due: "23 Agu", priority: "Sedang", status: "done" as const },
];

export default function TasksPage() {
  const [filter, setFilter] = useState("semua");
  const [query, setQuery] = useState("");

  const pills = [
    { key: "semua", label: "Semua", count: tasks.length },
    { key: "open", label: "Terbuka", count: tasks.filter((t) => t.status === "open").length },
    { key: "overdue", label: "Terlambat", count: tasks.filter((t) => t.status === "overdue").length },
    { key: "done", label: "Selesai", count: tasks.filter((t) => t.status === "done").length },
  ];

  const filtered = tasks.filter((t) => {
    const q = query.toLowerCase();
    return (
      (filter === "semua" || t.status === filter) &&
      (!q || t.title.toLowerCase().includes(q) || t.contact.toLowerCase().includes(q))
    );
  });

  const cols: Column<(typeof tasks)[number]>[] = [
    { key: "title", header: "Tugas", render: (t) => <span className="font-semibold text-slate-100">{t.title}</span> },
    { key: "contact", header: "Kontak", render: (t) => <span className="text-muted">{t.contact}</span> },
    { key: "due", header: "Jatuh Tempo", render: (t) => <span className={t.status === "overdue" ? "font-bold text-danger" : "text-slate-300"}>{t.due}</span> },
    { key: "priority", header: "Prioritas", render: (t) => <Badge variant={t.priority === "Tinggi" ? "danger" : t.priority === "Sedang" ? "warning" : "info"}>{t.priority}</Badge> },
    { key: "status", header: "Status", render: (t) => <Badge variant={t.status === "done" ? "success" : t.status === "overdue" ? "danger" : "warning"}>{t.status === "done" ? "✔ Selesai" : t.status === "overdue" ? "⚠ Terlambat" : "Terbuka"}</Badge> },
    {
      key: "actions",
      header: "Aksi",
      className: "text-right",
      render: (t) => (
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm">Buka</Button>
          {t.status !== "done" && <Button variant="success" size="sm">Selesai</Button>}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Tasks"
        subtitle="Reminder & tugas follow-up manual"
        actions={<Button size="sm">+ Tambah Task</Button>}
      />

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-edge/60 px-5 py-4">
          <FilterPills pills={pills} active={filter} onChange={setFilter} />
          <div className="w-full sm:w-64">
            <Input placeholder="Cari tugas..." value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
        </div>
        <DataTable columns={cols} rows={filtered} emptyText="Tidak ada tugas" />
      </Card>
    </div>
  );
}