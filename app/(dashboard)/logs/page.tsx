"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { PageHeader } from "@/components/layout/page-header";

type LogEntry = {
  ts: string;
  level: string;
  msg: string;
  [key: string]: unknown;
};

type Filter = "all" | "error" | "warn" | "info";

function levelColor(level: string) {
  switch (level?.toLowerCase()) {
    case "error": return "text-red-400";
    case "warn":  return "text-yellow-400";
    case "info":  return "text-blue-400";
    default:      return "text-muted-foreground";
  }
}

function levelBadge(level: string) {
  switch (level?.toLowerCase()) {
    case "error": return "bg-red-500/20 text-red-400 border border-red-500/30";
    case "warn":  return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30";
    case "info":  return "bg-blue-500/20 text-blue-400 border border-blue-500/30";
    default:      return "bg-muted text-muted-foreground border border-border";
  }
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [n, setN] = useState(50);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch(`/api/wa/logs?n=${n}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as { ok: boolean; logs: LogEntry[]; reason?: string };
      if (data.ok) {
        setLogs(data.logs ?? []);
        setError(null);
        setLastRefresh(new Date());
      } else {
        setError(data.reason ?? "Gagal ambil logs");
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [n]);

  // Initial + auto-refresh
  useEffect(() => {
    let cancelled = false;
    const tick = async () => { if (!cancelled) await fetchLogs(); };
    tick();
    if (!autoRefresh) return;
    const interval = setInterval(tick, 5_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [fetchLogs, autoRefresh]);

  // Scroll to bottom on new logs
  useEffect(() => {
    if (autoRefresh) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs, autoRefresh]);

  const filtered = logs.filter((l) => {
    if (filter === "all") return true;
    return l.level?.toLowerCase() === filter;
  });

  const counts = {
    all: logs.length,
    error: logs.filter((l) => l.level?.toLowerCase() === "error").length,
    warn: logs.filter((l) => l.level?.toLowerCase() === "warn").length,
    info: logs.filter((l) => l.level?.toLowerCase() === "info").length,
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="WA Bridge Logs"
        description="Live log dari Hermes VPS WA Bridge"
        action={
          <div className="flex items-center gap-2">
            {/* N selector */}
            <select
              value={n}
              onChange={(e) => setN(Number(e.target.value))}
              className="text-xs rounded-lg border border-border bg-card px-2 py-1.5 text-foreground"
            >
              {[20, 50, 100].map((v) => (
                <option key={v} value={v}>{v} baris</option>
              ))}
            </select>

            {/* Auto-refresh toggle */}
            <button
              onClick={() => setAutoRefresh((p) => !p)}
              className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                autoRefresh
                  ? "bg-green-500/20 text-green-400 border-green-500/30"
                  : "bg-muted text-muted-foreground border-border"
              }`}
            >
              {autoRefresh ? "⏱ Auto (5s)" : "⏸ Paused"}
            </button>

            {/* Manual refresh */}
            <button
              onClick={fetchLogs}
              className="text-xs px-3 py-1.5 rounded-lg border border-border bg-card text-foreground hover:bg-muted transition-colors"
            >
              ↻ Refresh
            </button>
          </div>
        }
      />

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(["all", "error", "warn", "info"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors capitalize ${
              filter === f
                ? "bg-accent text-accent-foreground border-accent"
                : "bg-card text-muted-foreground border-border hover:bg-muted"
            }`}
          >
            {f === "all" ? "Semua" : f.toUpperCase()}
            <span className="ml-1.5 opacity-70">{counts[f]}</span>
          </button>
        ))}

        {lastRefresh && (
          <span className="ml-auto text-xs text-muted-foreground self-center">
            Update: {lastRefresh.toLocaleTimeString("id-ID")}
          </span>
        )}
      </div>

      {/* Log terminal */}
      <div className="rounded-xl border border-border bg-[#0d1117] font-mono text-xs overflow-hidden">
        {/* Terminal header */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-[#161b22]">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500/70" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
            <span className="w-3 h-3 rounded-full bg-green-500/70" />
          </div>
          <span className="text-muted-foreground text-xs ml-2">wa-bridge.log — {filtered.length} entries</span>
        </div>

        {/* Log content */}
        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-1">
          {loading && (
            <p className="text-muted-foreground">Memuat logs...</p>
          )}

          {error && (
            <p className="text-red-400">⚠ {error}</p>
          )}

          {!loading && !error && filtered.length === 0 && (
            <p className="text-muted-foreground">Tidak ada log {filter !== "all" ? `level ${filter}` : ""}.</p>
          )}

          {filtered.map((log, i) => {
            // Format extra fields
            const extras = Object.entries(log)
              .filter(([k]) => !["ts", "level", "msg"].includes(k))
              .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
              .join(" ");

            return (
              <div key={i} className="flex gap-3 leading-relaxed hover:bg-white/5 px-1 rounded">
                {/* Timestamp */}
                <span className="text-muted-foreground shrink-0 w-[140px] truncate">
                  {log.ts ? new Date(log.ts).toLocaleTimeString("id-ID", {
                    hour: "2-digit", minute: "2-digit", second: "2-digit",
                  }) : "—"}
                </span>

                {/* Level badge */}
                <span className={`shrink-0 px-1.5 rounded text-[10px] font-bold uppercase w-12 text-center ${levelBadge(log.level)}`}>
                  {log.level ?? "LOG"}
                </span>

                {/* Message */}
                <span className={`flex-1 break-all ${levelColor(log.level)}`}>
                  {log.msg}
                  {extras && <span className="text-muted-foreground ml-2 opacity-60">{extras}</span>}
                </span>
              </div>
            );
          })}

          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
}
