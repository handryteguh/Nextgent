"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { KpiCard } from "@/components/ui/kpi-card";

// ── Types ─────────────────────────────────────────────────────────────────────
type Summary = {
  contacts: { total: number; leads: number; customers: number };
  tasks: { overdue: number; pending: number; total: number };
  followup: { active: number; paused: number; completed: number };
  deals: { active: number; pipelineValue: number; won: number };
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
  coins: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  alert: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
  ),
  check: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

// ── FU Donut chart ─────────────────────────────────────────────────────────────
function DonutChart({ active, paused, completed, stopped }: { active: number; paused: number; completed: number; stopped: number }) {
  const total = active + paused + completed + stopped;
  const R = 70;
  const C = 2 * Math.PI * R;
  const segments = [
    { label: "Aktif", value: active, color: "#22D3EE" },
    { label: "Paused", value: paused, color: "#FB923C" },
    { label: "Selesai", value: completed, color: "#34D399" },
    { label: "Stop", value: stopped, color: "#FB7185" },
  ].filter((s) => s.value > 0);

  let offset = 0;
  const drawn = segments.map((s) => {
    const dash = total > 0 ? (s.value / total) * C : 0;
    const result = { ...s, dash, offset };
    offset += dash;
    return result;
  });

  return (
    <div className="relative flex items-center justify-center">
      <svg viewBox="0 0 180 180" className="h-44 w-44">
        <circle cx="90" cy="90" r={R} fill="none" stroke="#1E293B" strokeWidth="20" />
        {drawn.map((d) => (
          <circle
            key={d.label}
            cx="90" cy="90" r={R}
            fill="none"
            stroke={d.color}
            strokeWidth="20"
            strokeDasharray={`${d.dash} ${C - d.dash}`}
            strokeDashoffset={-d.offset}
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

// ── Recent activity placeholder ────────────────────────────────────────────────
const recentActivity = [
  { time: "Barusan", text: "Sequence aktif berjalan", color: "bg-info" },
  { time: "Tadi", text: "Data kontak tersimpan", color: "bg-accent" },
  { time: "Hari ini", text: "Tasks pending menunggu", color: "bg-orange" },
];

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
      // keep showing last data / skeleton
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
      sub: s ? `${s.contacts.leads} lead · ${s.contacts.customers} customer` : undefined,
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
      sub: s ? `${s.followup.paused} paused · ${s.followup.completed} selesai` : undefined,
      icon: icons.bolt,
      color: "violet" as const,
    },
    {
      label: "Deal Aktif",
      value: loading ? "—" : (s?.deals.active ?? 0),
      sub: s ? `Pipeline Rp ${(s.deals.pipelineValue / 1000).toFixed(0)}rb` : undefined,
      icon: icons.coins,
      color: "orange" as const,
    },
    {
      label: "Task Overdue",
      value: loading ? "—" : (s?.tasks.overdue ?? 0),
      sub: s ? `${s.tasks.pending} pending` : undefined,
      icon: icons.alert,
      color: "danger" as const,
    },
    {
      label: "Deal Won",
      value: loading ? "—" : (s?.deals.won ?? 0),
      sub: "Total deal berhasil",
      icon: icons.check,
      color: "success" as const,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Ringkasan aktivitas CRM & Follow-up"
      />

      {/* KPI Grid */}
      <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-3 2xl:grid-cols-6">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </div>

      {/* Charts + Activity row */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Follow-up donut */}
        <Card>
          <CardHeader title="Follow-up Status" subtitle="Distribusi semua sequence job" />
          <CardBody>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
              <DonutChart
                active={s?.followup.active ?? 0}
                paused={s?.followup.paused ?? 0}
                completed={s?.followup.completed ?? 0}
                stopped={0}
              />
              <div className="flex flex-wrap gap-x-6 gap-y-2 sm:flex-col">
                {[
                  { label: "Aktif", color: "bg-info", value: s?.followup.active ?? 0 },
                  { label: "Paused", color: "bg-orange", value: s?.followup.paused ?? 0 },
                  { label: "Selesai", color: "bg-success", value: s?.followup.completed ?? 0 },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${item.color}`} />
                    <span className="text-xs text-muted">{item.label}</span>
                    <span className="ml-auto text-xs font-bold text-slate-100">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Pipeline summary */}
        <Card>
          <CardHeader title="Pipeline Deals" subtitle="Nilai open deals per stage" />
          <CardBody>
            {loading ? (
              <p className="text-sm text-muted">Memuat...</p>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted">Deal Aktif</span>
                  <span className="font-bold text-slate-100">{s?.deals.active ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted">Nilai Pipeline</span>
                  <span className="font-bold text-accent">
                    Rp {((s?.deals.pipelineValue ?? 0) / 1000).toFixed(0)}rb
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted">Deal Won</span>
                  <span className="font-bold text-success">{s?.deals.won ?? 0}</span>
                </div>
                <div className="mt-2 rounded-lg border border-edge/40 bg-surface-2/40 px-3 py-2 text-xs text-muted">
                  Forecast = nilai × probabilitas stage. Lihat detail di /deals.
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Recent activity */}
        <Card>
          <CardHeader title="Aktivitas Terkini" subtitle="Update terakhir sistem" />
          <CardBody>
            <div className="space-y-3">
              {recentActivity.map((a, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${a.color}`} />
                  <div className="min-w-0">
                    <p className="text-sm text-slate-200">{a.text}</p>
                    <p className="text-xs text-muted">{a.time}</p>
                  </div>
                </div>
              ))}
              <p className="pt-1 text-xs text-faint">
                Aktivitas real-time tersedia setelah bridge WA terhubung.
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
