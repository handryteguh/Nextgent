"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FilterPills } from "@/components/ui/filter-pills";
import { DataTable, type Column } from "@/components/ui/data-table";
import { timeAgo } from "@/lib/utils";

const logs = [
  { id: 1, waktu: 1786651545, user: "yanazmi@gmail.com", aksi: "GENERATE", detail: "saya sedang membangun bisnis Software...", status: "OK", ip: "2001:448a:1123:1caa:f8cf:78f5:20d9:e044" },
  { id: 2, waktu: 1786639240, user: "yanazmi@gmail.com", aksi: "LOGIN", detail: "google_one_tap", status: "", ip: "2001:448a:1123:1caa:f8cf:78f5:20d9:e044" },
  { id: 3, waktu: 1786558332, user: "handry.teguh@gmail.com", aksi: "GENERATE", detail: "Gue mau bikin e-course online cara jualan di TikTok Shop...", status: "OK", ip: "2001:448a:1082:7da7:7582:8e1a:5a0b:3b52" },
  { id: 4, waktu: 1786471978, user: "handry.teguh@gmail.com", aksi: "GENERATE", detail: "Gue mau buka warung kopi susu di dekat...", status: "OK", ip: "2001:448a:1082:7da7:7582:8e1a:5a0b:3b52" },
  { id: 5, waktu: 1786387200, user: "evi.yuslatin@gmail.com", aksi: "LOGIN", detail: "password_login", status: "OK", ip: "114.125.64.22" },
  { id: 6, waktu: 1786300800, user: "fajar.servis@gmail.com", aksi: "LOGIN", detail: "password_login", status: "FAIL", ip: "36.72.118.9" },
];

export default function LogsPage() {
  const [filter, setFilter] = useState("semua");
  const [query, setQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const pills = [
    { key: "semua", label: "Semua", count: logs.length },
    { key: "login", label: "Login", count: logs.filter((l) => l.aksi === "LOGIN").length },
    { key: "generate", label: "Generate", count: logs.filter((l) => l.aksi === "GENERATE").length },
  ];

  const filtered = logs.filter((l) => {
    const q = query.toLowerCase();
    return (
      (filter === "semua" || (filter === "login" && l.aksi === "LOGIN") || (filter === "generate" && l.aksi === "GENERATE")) &&
      (!q || l.user.toLowerCase().includes(q) || l.detail.toLowerCase().includes(q) || l.ip.includes(q))
    );
  });

  const cols: Column<(typeof logs)[number]>[] = [
    { key: "waktu", header: "Waktu", render: (l) => <span className="whitespace-nowrap text-xs text-faint">{timeAgo(l.waktu)}</span> },
    { key: "user", header: "User", render: (l) => <span className="font-semibold text-slate-100">{l.user}</span> },
    { key: "aksi", header: "Aksi", render: (l) => <Badge variant={l.aksi === "LOGIN" ? "info" : "violet"}>{l.aksi}</Badge> },
    { key: "detail", header: "Detail", render: (l) => <span className="line-clamp-1 max-w-md text-xs text-muted">{l.detail}</span> },
    { key: "status", header: "Status", render: (l) => (l.status ? <Badge variant={l.status === "OK" ? "success" : "danger"}>{l.status}</Badge> : <span className="text-faint">—</span>) },
    { key: "ip", header: "IP", render: (l) => <span className="font-mono text-[10px] text-faint">{l.ip}</span> },
  ];

  return (
    <div>
      <PageHeader
        title="Logs"
        subtitle="Aktivitas user — login & generate (statis di Phase 0)"
        actions={
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-faint">auto-refresh 30 detik</span>
            <Button variant="outline" size="sm" onClick={() => { setRefreshing(true); setTimeout(() => setRefreshing(false), 600); }}>
              ↻ {refreshing ? "Menyegarkan..." : "Refresh"}
            </Button>
          </div>
        }
      />

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-edge/60 px-5 py-4">
          <FilterPills pills={pills} active={filter} onChange={setFilter} />
          <div className="w-full sm:w-64">
            <Input placeholder="Cari email, detail, atau IP..." value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
        </div>
        <DataTable columns={cols} rows={filtered} emptyText="Tidak ada log" />
      </Card>
    </div>
  );
}