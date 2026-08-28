"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FilterPills } from "@/components/ui/filter-pills";
import { DataTable, type Column } from "@/components/ui/data-table";
import { timeAgo } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────────
type Log = {
  id: number;
  actor: string;
  action: string;
  entity: string | null;
  entityId: number | null;
  detail: string | null;
  status: "ok" | "fail" | "warn" | null;
  ip: string | null;
  createdAt: number;
};

type Meta = {
  total: number;
  counts: Record<string, number>;
};

// ── Main ───────────────────────────────────────────────────────────────────────
export default function LogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [meta, setMeta] = useState<Meta>({ total: 0, counts: {} });
  const [filter, setFilter] = useState("semua");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLogs = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const res = await fetch(`/api/logs?filter=${filter}&limit=200`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.data ?? []);
        setMeta(data.meta ?? { total: 0, counts: {} });
      }
    } finally {
      setLoading(false);
      if (showRefresh) setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => { if (!cancelled) await fetchLogs(); };
    void tick();
    const interval = setInterval(() => { void tick(); }, 30_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [fetchLogs]);

  // ── Filter pills ───────────────────────────────────────────────────────────
  const pills = [
    { key: "semua", label: "Semua", count: meta.total },
    { key: "ok", label: "OK", count: meta.counts["ok"] ?? 0 },
    { key: "warn", label: "Warning", count: meta.counts["warn"] ?? 0 },
    { key: "fail", label: "Gagal", count: meta.counts["fail"] ?? 0 },
  ];

  // ── Client-side search ─────────────────────────────────────────────────────
  const filtered = logs.filter((l) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      l.actor.toLowerCase().includes(q) ||
      l.action.toLowerCase().includes(q) ||
      (l.entity ?? "").toLowerCase().includes(q) ||
      (l.detail ?? "").toLowerCase().includes(q) ||
      (l.ip ?? "").includes(q)
    );
  });

  // ── Status badge ───────────────────────────────────────────────────────────
  function statusBadge(status: Log["status"]) {
    if (status === "ok") return <Badge variant="success">OK</Badge>;
    if (status === "warn") return <Badge variant="warning">Warn</Badge>;
    if (status === "fail") return <Badge variant="danger">Gagal</Badge>;
    return <Badge variant="default">—</Badge>;
  }

  // ── Action badge ───────────────────────────────────────────────────────────
  function actionBadge(action: string) {
    const map: Record<string, "info" | "success" | "warning" | "danger" | "default"> = {
      LOGIN: "info",
      LOGOUT: "default",
      SEND_WA: "success",
      FOLLOWUP: "success",
      WEBHOOK: "info",
      CREATE: "success",
      UPDATE: "warning",
      DELETE: "danger",
    };
    return <Badge variant={map[action] ?? "default"}>{action}</Badge>;
  }

  // ── Columns ────────────────────────────────────────────────────────────────
  const cols: Column<Log>[] = [
    {
      key: "createdAt",
      header: "Waktu",
      render: (l) => (
        <span className="whitespace-nowrap text-xs text-faint">{timeAgo(l.createdAt)}</span>
      ),
    },
    {
      key: "actor",
      header: "Actor",
      render: (l) => (
        <span className="max-w-[120px] truncate text-xs font-semibold text-slate-200">{l.actor}</span>
      ),
    },
    {
      key: "action",
      header: "Aksi",
      render: (l) => actionBadge(l.action),
    },
    {
      key: "entity",
      header: "Entity",
      render: (l) => l.entity ? (
        <span className="text-xs text-muted">
          {l.entity}{l.entityId ? ` #${l.entityId}` : ""}
        </span>
      ) : <span className="text-xs text-faint">—</span>,
    },
    {
      key: "detail",
      header: "Detail",
      render: (l) => (
        <span className="line-clamp-1 max-w-xs text-xs text-muted">{l.detail ?? "—"}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (l) => statusBadge(l.status),
    },
    {
      key: "ip",
      header: "IP",
      render: (l) => (
        <span className="whitespace-nowrap text-[10px] text-faint">{l.ip ?? "—"}</span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Activity Logs"
        subtitle="Riwayat aksi sistem — login, kirim WA, follow-up, webhook"
        actions={
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-faint">auto-refresh 30s</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { void fetchLogs(true); }}
            >
              {refreshing ? "↻ Menyegarkan..." : "↻ Refresh"}
            </Button>
          </div>
        }
      />

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-edge/60 px-5 py-4">
          <FilterPills pills={pills} active={filter} onChange={setFilter} />
          <div className="w-full sm:w-72">
            <Input
              placeholder="Cari actor, aksi, entity, detail, IP..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <p className="py-10 text-center text-sm text-muted">Memuat log...</p>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-muted">Belum ada activity log</p>
            <p className="mt-1 text-xs text-faint">
              Log otomatis muncul setelah ada aksi: login, kirim WA, follow-up, webhook
            </p>
          </div>
        ) : (
          <DataTable columns={cols} rows={filtered} emptyText="Tidak ada log" />
        )}

        {!loading && meta.total > 0 && (
          <div className="border-t border-edge/60 px-5 py-3 text-[11px] text-faint">
            Menampilkan {filtered.length} dari {meta.total} log
          </div>
        )}
      </Card>
    </div>
  );
}
