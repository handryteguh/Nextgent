"use client";

import { useEffect, useState } from "react";

type SessionInfo = {
  id: string;
  title: string | null;
  startedAt: string | null;
  lastActive: string | null;
  messageCount: number;
  toolCalls: number;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  reasoningTokens: number;
  costUsd: number | null;
  lastUserPrompt: string | null;
  model: string | null;
};

type AgentInfo = {
  name: string;
  gateway: "running" | "stopped" | "unknown";
  gatewayPid: number | null;
  sessionCount: number;
  totalMessages: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCacheReadTokens: number;
  totalReasoningTokens: number;
  totalCostUsd: number;
  lastSession: SessionInfo | null;
  lastTask: { prompt: string; sessionId: string; when: string } | null;
};

type OverviewData = {
  ok: boolean;
  generatedAt: string;
  cron: { enabled: boolean; count: number; jobs: unknown[] };
  agents: AgentInfo[];
};

const fmt = new Intl.NumberFormat("id-ID");

function fmtTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function timeAgo(ts: string | number | null): string {
  if (!ts) return "—";
  const t = typeof ts === "number" ? ts * 1000 : new Date(ts).getTime();
  if (!t || isNaN(t)) return "—";
  const diff = Date.now() - t;
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "baru saja";
  if (min < 60) return `${min}m lalu`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}j lalu`;
  const d = Math.floor(h / 24);
  return `${d}h lalu`;
}

export default function Overview() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/overview", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/overview", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const totals = data?.agents.reduce(
    (acc, a) => ({
      sessions: acc.sessions + a.sessionCount,
      messages: acc.messages + a.totalMessages,
      input: acc.input + a.totalInputTokens,
      output: acc.output + a.totalOutputTokens,
      cost: acc.cost + a.totalCostUsd,
    }),
    { sessions: 0, messages: 0, input: 0, output: 0, cost: 0 }
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* Header */}
        <header className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Hermes Overview</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Status agent, sessions, pemakaian token & cron jobs
            </p>
          </div>
          <div className="flex items-center gap-3">
            {data && (
              <span className="text-xs text-zinc-500">
                Diperbarui {new Date(data.generatedAt).toLocaleTimeString("id-ID")}
              </span>
            )}
            <button
              onClick={load}
              disabled={loading}
              className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 transition hover:bg-zinc-800 disabled:opacity-50"
            >
              {loading ? "Memuat…" : "↻ Refresh"}
            </button>
          </div>
        </header>

        {error && (
          <div className="mb-6 rounded-xl border border-red-800 bg-red-950/40 p-4 text-sm text-red-300">
            Gagal memuat data: {error}
          </div>
        )}

        {/* Summary cards */}
        {totals && (
          <section className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <SummaryCard label="Agents" value={String(data?.agents.length ?? 0)} />
            <SummaryCard label="Sessions" value={fmt.format(totals.sessions)} />
            <SummaryCard label="Messages" value={fmt.format(totals.messages)} />
            <SummaryCard label="Input tokens" value={fmtTokens(totals.input)} />
            <SummaryCard label="Output tokens" value={fmtTokens(totals.output)} />
          </section>
        )}

        {/* Cron status */}
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Cron Jobs
          </h2>
          <div
            className={`flex items-center gap-3 rounded-xl border p-4 ${
              data?.cron.enabled
                ? "border-emerald-800 bg-emerald-950/30"
                : "border-zinc-800 bg-zinc-900/40"
            }`}
          >
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                data?.cron.enabled ? "bg-emerald-400" : "bg-zinc-600"
              }`}
            />
            <div>
              <p className="text-sm font-medium">
                {data?.cron.enabled
                  ? `${data.cron.count} cron job aktif`
                  : "Tidak ada cron job"}
              </p>
              <p className="text-xs text-zinc-500">
                {data?.cron.enabled
                  ? "Jadwal otomatis berjalan"
                  : "Belum ada jadwal otomatis. Bisa dibuat via /cron"}
              </p>
            </div>
          </div>
        </section>

        {/* Agent cards */}
        <section className="space-y-4">
          {data?.agents.map((agent) => (
            <AgentCard key={agent.name} agent={agent} />
          ))}
        </section>
      </main>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <p className="text-xs uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-zinc-100">{value}</p>
    </div>
  );
}

function AgentCard({ agent }: { agent: AgentInfo }) {
  const running = agent.gateway === "running";
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
      {/* Agent header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg font-bold ${
              running
                ? "bg-gradient-to-br from-emerald-500 to-teal-600"
                : "bg-zinc-700"
            }`}
          >
            {agent.name[0].toUpperCase()}
          </div>
          <div>
            <p className="font-semibold">{agent.name}</p>
            <p className="text-xs text-zinc-500">
              {running ? `Gateway running${agent.gatewayPid ? ` (PID ${agent.gatewayPid})` : ""}` : "Gateway stopped"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              running ? "bg-emerald-950 text-emerald-400" : "bg-zinc-800 text-zinc-400"
            }`}
          >
            {running ? "● running" : "○ stopped"}
          </span>
        </div>
      </div>

      {/* Token usage */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <TokenBox label="Sessions" value={String(agent.sessionCount)} />
        <TokenBox label="Messages" value={fmt.format(agent.totalMessages)} />
        <TokenBox label="Input" value={fmtTokens(agent.totalInputTokens)} />
        <TokenBox label="Output" value={fmtTokens(agent.totalOutputTokens)} />
      </div>
      <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <TokenBox label="Cache read" value={fmtTokens(agent.totalCacheReadTokens)} subtle />
        <TokenBox label="Reasoning" value={fmtTokens(agent.totalReasoningTokens)} subtle />
        <TokenBox label="Cost" value={`$${agent.totalCostUsd.toFixed(4)}`} subtle />
        <TokenBox label="Tool calls" value={fmt.format(agent.totalMessages)} subtle />
      </div>

      {/* Last task */}
      {agent.lastTask && (
        <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Task Terakhir
          </p>
          <p className="mt-1 truncate text-sm text-zinc-200" title={agent.lastTask.prompt}>
            “{agent.lastTask.prompt}”
          </p>
          <p className="mt-1 text-xs text-zinc-600">
            {agent.lastSession?.title ?? "Tanpa judul"} · {timeAgo(agent.lastTask.when)} ·{" "}
            {agent.lastTask.sessionId.slice(0, 8)}… · {agent.lastSession?.messageCount ?? 0} msg ·{" "}
            {agent.lastSession?.toolCalls ?? 0} tool calls
          </p>
        </div>
      )}
    </div>
  );
}

function TokenBox({ label, value, subtle }: { label: string; value: string; subtle?: boolean }) {
  return (
    <div className="rounded-lg border border-zinc-800/70 bg-zinc-950/40 px-3 py-2">
      <p className={`text-[10px] uppercase tracking-wider ${subtle ? "text-zinc-600" : "text-zinc-500"}`}>
        {label}
      </p>
      <p className={`text-sm font-semibold ${subtle ? "text-zinc-400" : "text-zinc-100"}`}>{value}</p>
    </div>
  );
}
