"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { KpiCard } from "@/components/ui/kpi-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// ── Types ─────────────────────────────────────────────────────────────────────
type Summary = {
  contacts: { total: number; leads: number; customers: number };
  tasks: { overdue: number; pending: number; total: number };
  followup: { active: number; paused: number; completed: number };
  deals: { active: number; pipelineValue: number; won: number };
  sequences: { total: number; active: number };
  wa: { connected: boolean; uptime?: number; queueLength?: number; memMb?: number };
};

// ── Icons ─────────────────────────────────────────────────────────────────────
const icons = {
  users: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  wa: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8m-8 4h5m-9 6h16a2 2 0 002-2V6a2 2 0 00-2-2H4a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  bolt: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  userCheck: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  alert: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
  ),
  sequence: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
    </svg>
  ),
};

// ── Line Chart SVG ─────────────────────────────────────────────────────────────
function LineChart({ days, chat, fu }: { days: string[]; chat: number[]; fu: number[] }) {
  const W = 600;
  const H = 200;
  const P = { l: 32, r: 12, t: 12, b: 28 };
  const max = Math.max(...chat, ...fu, 1) * 1.15;
  const stepX = (W - P.l - P.r) / (days.length - 1);

  const path = (arr: number[]) => {
    const pts = arr.map((v, i) => [P.l + i * stepX, P.t + H - P.b - (v / max) * (H - P.t - P.b)] as const);
    if (pts.length < 2) return "";
    let d = `M ${pts[0][0]},${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1];
      const [x1, y1] = pts[i];
      const mx = (x0 + x1) / 2;
      d += ` C ${mx},${y0} ${mx},${y1} ${x1},${y1}`;
    }
    return d;
  };

  const areaPath = (arr: number[]) => {
    const line = path(arr);
    if (!line) return "";
    const lastX = P.l + (arr.length - 1) * stepX;
    const baseY = P.t + H - P.b;
    return `${line} L ${lastX},${baseY} L ${P.l},${baseY} Z`;
  };

  return (
    <div className="w-full overflow-hidden">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="gradFu" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F5C044" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#F5C044" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="gradChat" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#22D3EE" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line
            key={f}
            x1={P.l} x2={W - P.r}
            y1={P.t + H - P.b - f * (H - P.t - P.b)}
            y2={P.t + H - P.b - f * (H - P.t - P.b)}
            stroke="#1E293B" strokeWidth="0.5"
          />
        ))}
        <path d={areaPath(fu)} fill="url(#gradFu)" />
        <path d={areaPath(chat)} fill="url(#gradChat)" />
        <path d={path(fu)} fill="none" stroke="#F5C044" strokeWidth="2" strokeLinecap="round" />
        <path d={path(chat)} fill="none" stroke="#22D3EE" strokeWidth="2" strokeLinecap="round" />
        {fu.map((v, i) => (
          <circle key={i} cx={P.l + i * stepX} cy={P.t + H - P.b - (v / max) * (H - P.t - P.b)} r="2.5" fill="#F5C044" />
        ))}
        {chat.map((v, i) => (
          <circle key={i} cx={P.l + i * stepX} cy={P.t + H - P.b - (v / max) * (H - P.t - P.b)} r="2.5" fill="#22D3EE" />
        ))}
        {days.map((d, i) => (
          <text key={d} x={P.l + i * stepX} y={H - 6} textAnchor="middle" fontSize="8" fill="#475569" fontFamily="Inter, sans-serif">
            {i % 2 === 0 ? d : ""}
          </text>
        ))}
      </svg>
    </div>
  );
}

// ── Donut Chart ────────────────────────────────────────────────────────────────
function DonutChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const R = 70;
  const C = 2 * Math.PI * R;
  const segments = data.reduce<{ label: string; value: number; color: string; dash: number; offset: number }[]>(
    (acc, d) => {
      const dash = total > 0 ? (d.value / total) * C : 0;
      const prevOffset = acc.length > 0 ? acc[acc.length - 1].offset + acc[acc.length - 1].dash : 0;
      return [...acc, { ...d, dash, offset: prevOffset }];
    },
    []
  );

  return (
    <div className="relative flex items-center justify-center">
      <svg viewBox="0 0 180 180" className="h-40 w-40">
        <circle cx="90" cy="90" r={R} fill="none" stroke="#1E293B" strokeWidth="20" />
        {segments.map((s) => (
          <circle
            key={s.label}
            cx="90" cy="90" r={R}
            fill="none"
            stroke={s.color}
            strokeWidth="20"
            strokeDasharray={`${s.dash} ${C - s.dash}`}
            strokeDashoffset={-s.offset}
            transform="rotate(-90 90 90)"
            strokeLinecap="round"
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-extrabold text-slate-100">{total}</span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">Total</span>
      </div>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function getLast14Days() {
  const days: string[] = [];
  const now = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days.push(d.toLocaleDateString("id-ID", { day: "numeric", month: "short" }));
  }
  return days;
}

const chartDays = getLast14Days();
const fuChartData = Array(14).fill(0);
const chatChartData = Array(14).fill(0);

// ── WA Status Banner ──────────────────────────────────────────────────────────
function formatUptime(seconds?: number) {
  if (!seconds) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}j ${m}m uptime`;
  return `${m}m uptime`;
}

function WaBanner({ wa }: { wa: Summary["wa"] }) {
  const { connected, uptime, queueLength, memMb } = wa;
  if (connected) {
    return (
      <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-success/30 bg-success/10 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-success opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
          </span>
          <p className="text-sm font-semibold text-success">WhatsApp terhubung — bridge aktif</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted">
          {formatUptime(uptime) && (
            <span className="rounded-md border border-edge/40 bg-surface-2/50 px-2 py-0.5">
              {formatUptime(uptime)}
            </span>
          )}
          {queueLength !== undefined && (
            <span className="rounded-md border border-edge/40 bg-surface-2/50 px-2 py-0.5">
              queue: {queueLength}
            </span>
          )}
          {memMb !== undefined && (
            <span className="rounded-md border border-edge/40 bg-surface-2/50 px-2 py-0.5">
              {memMb} MB
            </span>
          )}
        </div>
      </div>
    );
  }
  return (
    <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="relative inline-flex h-2 w-2 rounded-full bg-danger" />
        </span>
        <p className="text-sm font-semibold text-danger">WhatsApp terputus — bridge belum terhubung</p>
      </div>
      <Badge variant="warning">Offline</Badge>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch("/api/summary", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setSummary(json.data);
      }
    } catch {
      // keep showing last data
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => { if (!cancelled) await fetchSummary(); };
    tick();
    const interval = setInterval(tick, 30_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [fetchSummary]);

  const s = summary;

  const kpis = [
    {
      label: "Total Kontak",
      value: loading ? "—" : (s?.contacts.total ?? 0),
      sub: s ? `${s.contacts.leads} lead · ${s.contacts.customers} customer` : "Memuat...",
      icon: icons.users,
      color: "accent" as const,
    },
    {
      label: "Chat Hari Ini",
      value: "—",
      sub: "Butuh bridge WA",
      icon: icons.wa,
      color: "info" as const,
    },
    {
      label: "Follow-up Aktif",
      value: loading ? "—" : (s?.followup.active ?? 0),
      sub: s ? `${s.followup.paused} paused · ${s.followup.completed} selesai` : "Memuat...",
      icon: icons.bolt,
      color: "violet" as const,
    },
    {
      label: "Task Overdue",
      value: loading ? "—" : (s?.tasks.overdue ?? 0),
      sub: s ? `${s.tasks.pending} pending` : "Memuat...",
      icon: icons.alert,
      color: "danger" as const,
    },
  ];

  const fuTiers = [
    { label: "Aktif", value: s?.followup.active ?? 0, color: "#22D3EE" },
    { label: "Paused", value: s?.followup.paused ?? 0, color: "#FB923C" },
    { label: "Selesai", value: s?.followup.completed ?? 0, color: "#34D399" },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        actions={<Button variant="outline" size="sm" onClick={() => fetchSummary()}>↻ Refresh</Button>}
      />

      {/* WA Status Banner */}
      <WaBanner wa={s?.wa ?? { connected: false }} />

      {/* KPI Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <KpiCard key={k.label} label={k.label} value={k.value} sub={k.sub} icon={k.icon} color={k.color} />
        ))}
      </div>

      {/* Charts row — line chart 2/3 + donut 1/3 */}
      <div className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Aktivitas Chat"
            subtitle="Pesan masuk & follow-up terkirim — 14 hari terakhir"
            action={
              <div className="flex items-center gap-3 text-[10px] font-semibold text-muted">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-info" /> Chat masuk
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "#F5C044" }} /> Follow-up
                </span>
              </div>
            }
          />
          <CardBody>
            <LineChart days={chartDays} chat={chatChartData} fu={fuChartData} />
            <p className="mt-2 text-center text-[10px] text-faint">
              Data aktif setelah bridge WA terhubung · Follow-up log tersedia setelah scheduler berjalan
            </p>
          </CardBody>
        </Card>

        {/* Donut FU */}
        <Card>
          <CardHeader title="Status Follow-up" subtitle="Distribusi seluruh sequence job" />
          <CardBody className="flex flex-col items-center">
            <DonutChart data={fuTiers} />
            <div className="mt-4 w-full space-y-2">
              {fuTiers.map((t) => (
                <div key={t.label} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2 text-slate-300">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                    {t.label}
                  </span>
                  <span className="font-bold text-slate-100">{t.value}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Bottom row — Sequences + Pipeline */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {/* Sequences */}
        <Card>
          <CardHeader title="Sequences" subtitle="Template follow-up otomatis" />
          <CardBody>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet/10 text-violet">
                {icons.sequence}
              </div>
              <div>
                <p className="text-3xl font-extrabold text-slate-100">{loading ? "—" : (s?.sequences.total ?? 0)}</p>
                <p className="text-xs text-muted">{s ? `${s.sequences.active} aktif` : "Memuat..."}</p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">Total sequences</span>
                <span className="font-bold text-slate-100">{s?.sequences.total ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">Aktif</span>
                <span className="font-bold text-success">{s?.sequences.active ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">Draft / nonaktif</span>
                <span className="font-bold text-muted">
                  {s ? (s.sequences.total - s.sequences.active) : "—"}
                </span>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Pipeline Deals */}
        <Card>
          <CardHeader title="Pipeline Deals" subtitle="Nilai open deals & konversi" />
          <CardBody>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">Deal aktif</span>
                <span className="font-bold text-slate-100">{s?.deals.active ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">Nilai pipeline</span>
                <span className="font-bold text-accent">
                  Rp {((s?.deals.pipelineValue ?? 0) / 1000).toFixed(0)}rb
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">Deal won</span>
                <span className="font-bold text-success">{s?.deals.won ?? "—"}</span>
              </div>
              <div className="mt-2 rounded-lg border border-edge/40 bg-surface-2/40 px-3 py-2 text-xs text-muted">
                Lihat detail Kanban di halaman <span className="text-accent">/deals</span>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Tasks summary */}
        <Card>
          <CardHeader title="Tasks" subtitle="Tugas & reminder tim" />
          <CardBody>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">Total tasks</span>
                <span className="font-bold text-slate-100">{s?.tasks.total ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">Pending</span>
                <span className="font-bold text-slate-100">{s?.tasks.pending ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">Overdue</span>
                <Badge variant={s && s.tasks.overdue > 0 ? "danger" : "default"}>
                  {s?.tasks.overdue ?? "—"}
                </Badge>
              </div>
              <div className="mt-2 rounded-lg border border-edge/40 bg-surface-2/40 px-3 py-2 text-xs text-muted">
                Lihat semua tasks di halaman <span className="text-accent">/tasks</span>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
