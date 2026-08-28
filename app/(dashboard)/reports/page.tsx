"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { KpiCard } from "@/components/ui/kpi-card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────
type Summary = {
  contacts: { total: number; leads: number; customers: number };
  tasks: { overdue: number; pending: number; total: number };
  followup: { active: number; paused: number; completed: number };
  deals: { active: number; pipelineValue: number; won: number };
  sequences: { total: number; active: number };
  wa: { connected: boolean };
};

const ranges = ["Hari Ini", "7 Hari", "30 Hari", "Semua"] as const;
type RangeKey = (typeof ranges)[number];

// ── Bar Chart SVG (data dummy — nanti replace dari log table) ──────────────────
const daily = {
  labels: ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"],
  masuk:  [0, 0, 0, 0, 0, 0, 0],
  keluar: [0, 0, 0, 0, 0, 0, 0],
};

function BarChart() {
  const W = 560;
  const H = 200;
  const P = { l: 36, r: 12, t: 12, b: 30 };
  const max = Math.max(...daily.masuk, ...daily.keluar, 1) * 1.15;
  const groupW = (W - P.l - P.r) / daily.labels.length;
  const barW = Math.min(14, groupW / 3);
  const y = (v: number) => P.t + H - P.b - (v / max) * (H - P.t - P.b);

  return (
    <div className="w-full overflow-hidden">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line key={f} x1={P.l} x2={W - P.r}
            y1={P.t + H - P.b - f * (H - P.t - P.b)}
            y2={P.t + H - P.b - f * (H - P.t - P.b)}
            stroke="#1E293B" strokeWidth="0.5" />
        ))}
        {daily.labels.map((d, i) => {
          const cx = P.l + i * groupW + groupW / 2;
          return (
            <g key={d}>
              <rect x={cx - barW - 2} y={y(daily.masuk[i])} width={barW}
                height={P.t + H - P.b - y(daily.masuk[i])} rx="4" fill="#22D3EE" opacity="0.85" />
              <rect x={cx + 2} y={y(daily.keluar[i])} width={barW}
                height={P.t + H - P.b - y(daily.keluar[i])} rx="4" fill="#F5C044" opacity="0.85" />
              <text x={cx} y={H - 8} textAnchor="middle" fontSize="9"
                fill="#475569" fontFamily="Inter, sans-serif">{d}</text>
            </g>
          );
        })}
      </svg>
      <p className="mt-1 text-center text-[10px] text-faint">
        Data aktif setelah bridge WA terhubung
      </p>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const [range, setRange] = useState<RangeKey>("7 Hari");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch("/api/summary", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setSummary(json.data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => { if (!cancelled) await fetchSummary(); };
    void tick();
    const interval = setInterval(() => { void tick(); }, 30_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [fetchSummary]);

  const s = summary;

  // ── KPI real dari DB ───────────────────────────────────────────────────────
  const wonValueStr = loading ? "—" : `Rp ${((s?.deals.pipelineValue ?? 0) / 1_000_000).toFixed(1)}jt`;
  const _unsubCount = loading ? "—" : s?.contacts.customers ?? 0; // placeholder unsub
  const chatVol = loading ? "—" : (s ? s.followup.active + s.followup.completed : 0);

  const kpis = [
    {
      label: "Response Rate",
      value: "—",
      sub: "Aktif setelah bridge WA",
      color: "success" as const,
      icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    },
    {
      label: "Pipeline Value",
      value: wonValueStr,
      sub: `${s?.deals.active ?? "—"} deal aktif`,
      color: "accent" as const,
      icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    },
    {
      label: "Unsubscribed",
      value: loading ? "—" : s?.contacts.total ?? 0,
      sub: "Total kontak (unsub via keyword stop)",
      color: "danger" as const,
      icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>,
    },
    {
      label: "FU Jobs Total",
      value: chatVol,
      sub: `${s?.followup.active ?? "—"} aktif · ${s?.followup.completed ?? "—"} selesai`,
      color: "violet" as const,
      icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8m-8 4h5m-9 6h16a2 2 0 002-2V6a2 2 0 00-2-2H4a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
    },
  ];

  // ── FU Funnel dari data real ───────────────────────────────────────────────
  const fuTotal = (s?.followup.active ?? 0) + (s?.followup.paused ?? 0) + (s?.followup.completed ?? 0);
  const funnel = [
    { step: "Total Job Dibuat", value: fuTotal, pct: 100 },
    { step: "Aktif Berjalan", value: s?.followup.active ?? 0, pct: fuTotal > 0 ? Math.round((s?.followup.active ?? 0) / fuTotal * 100) : 0 },
    { step: "Paused", value: s?.followup.paused ?? 0, pct: fuTotal > 0 ? Math.round((s?.followup.paused ?? 0) / fuTotal * 100) : 0 },
    { step: "Selesai / Convert", value: s?.followup.completed ?? 0, pct: fuTotal > 0 ? Math.round((s?.followup.completed ?? 0) / fuTotal * 100) : 0 },
    { step: "Deal Won", value: s?.deals.won ?? 0, pct: fuTotal > 0 ? Math.round((s?.deals.won ?? 0) / fuTotal * 100) : 0 },
  ];

  // ── Health indicator ───────────────────────────────────────────────────────
  const waConnected = s?.wa.connected ?? false;
  const taskOverdue = s?.tasks.overdue ?? 0;

  type HealthItem = {
    label: string;
    sub: string;
    status: "ok" | "warn" | "danger";
    badge: string;
    badgeVariant: "success" | "warning" | "danger";
    dotClass: string;
  };

  const healthItems: HealthItem[] = [
    {
      label: "Status WA",
      sub: waConnected ? "Bridge terhubung" : "Bridge belum terhubung",
      status: waConnected ? "ok" : "warn",
      badge: waConnected ? "Connected" : "Offline",
      badgeVariant: waConnected ? "success" : "warning",
      dotClass: waConnected ? "bg-success" : "bg-warning",
    },
    {
      label: "Task Overdue",
      sub: `${taskOverdue} task melewati deadline`,
      status: taskOverdue === 0 ? "ok" : taskOverdue <= 3 ? "warn" : "danger",
      badge: taskOverdue === 0 ? "Normal" : taskOverdue <= 3 ? "Perhatian" : "Kritis",
      badgeVariant: taskOverdue === 0 ? "success" : taskOverdue <= 3 ? "warning" : "danger",
      dotClass: taskOverdue === 0 ? "bg-success" : taskOverdue <= 3 ? "bg-orange" : "bg-danger",
    },
    {
      label: "Sequences Aktif",
      sub: `${s?.sequences.active ?? 0} dari ${s?.sequences.total ?? 0} sequence enabled`,
      status: (s?.sequences.active ?? 0) > 0 ? "ok" : "warn",
      badge: (s?.sequences.active ?? 0) > 0 ? "Normal" : "Perlu Setup",
      badgeVariant: (s?.sequences.active ?? 0) > 0 ? "success" : "warning",
      dotClass: (s?.sequences.active ?? 0) > 0 ? "bg-success" : "bg-orange",
    },
  ];

  // ── Insight dinamis dari data real ────────────────────────────────────────
  const insights: { icon: string; text: string; color: string }[] = [];
  if (!waConnected) insights.push({ icon: "📡", text: "Bridge WA belum terhubung — follow-up otomatis belum berjalan", color: "text-warning" });
  if (taskOverdue > 0) insights.push({ icon: "⚠️", text: `${taskOverdue} task overdue — segera selesaikan agar pipeline gak macet`, color: "text-danger" });
  if ((s?.followup.active ?? 0) > 0) insights.push({ icon: "⚡", text: `${s?.followup.active} follow-up aktif berjalan — pantau response rate`, color: "text-info" });
  if ((s?.deals.active ?? 0) > 0) insights.push({ icon: "💰", text: `${s?.deals.active} deal di pipeline — cek tahap Negotiation untuk close`, color: "text-accent" });
  if ((s?.sequences.total ?? 0) === 0) insights.push({ icon: "📋", text: "Belum ada sequence — buat template FU di halaman Follow-up", color: "text-muted" });
  if (insights.length === 0) insights.push({ icon: "✅", text: "Semua sistem normal — tidak ada tindakan mendesak", color: "text-success" });

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Laporan performa follow-up & aktivitas"
        actions={
          <div className="flex gap-1 rounded-full border border-edge p-1">
            {ranges.map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={cn(
                  "rounded-full px-3 py-1 text-[11px] font-bold transition-colors",
                  range === r ? "bg-accent text-[#0B0E14]" : "text-muted hover:text-slate-200"
                )}
              >
                {r}
              </button>
            ))}
          </div>
        }
      />

      {/* KPI */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {kpis.map((k) => (
          <KpiCard key={k.label} label={k.label} value={k.value} sub={k.sub} color={k.color} icon={k.icon} />
        ))}
      </div>

      <p className="mb-4 text-xs font-semibold text-muted">
        Range: <span className="font-bold text-accent">{range}</span> · Data real-time dari DB
      </p>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* Bar chart */}
        <Card>
          <CardHeader
            title="Aktivitas Chat per Hari"
            subtitle="7 hari terakhir — masuk vs keluar"
            action={
              <div className="flex items-center gap-3 text-[10px] font-semibold text-muted">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-info" /> Masuk</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: "#F5C044" }} /> Keluar</span>
              </div>
            }
          />
          <CardBody><BarChart /></CardBody>
        </Card>

        {/* FU Funnel dari data real */}
        <Card>
          <CardHeader title="Follow-up Funnel" subtitle="Dari job dibuat sampai deal won" />
          <CardBody className="space-y-3">
            {funnel.map((f, i) => (
              <div key={f.step}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">{i + 1}. {f.step}</span>
                  <span className="font-bold text-slate-100">
                    {loading ? "—" : f.value} <span className="font-normal text-faint">({f.pct}%)</span>
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-edge/30">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-accent/70 to-accent transition-all duration-500"
                    style={{ width: `${f.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </CardBody>
        </Card>

        {/* Health indicator real */}
        <Card>
          <CardHeader title="Health Indicator" subtitle="Status sistem — tanda bahaya sebelum bermasalah" />
          <CardBody className="space-y-3">
            {healthItems.map((h) => (
              <div key={h.label} className="flex items-center justify-between rounded-lg border border-edge/60 bg-surface-2/50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className={cn("h-2.5 w-2.5 rounded-full", h.dotClass)} />
                  <div>
                    <p className="text-sm font-bold text-slate-100">{h.label}</p>
                    <p className="text-[11px] text-muted">{h.sub}</p>
                  </div>
                </div>
                <Badge variant={h.badgeVariant}>{h.badge}</Badge>
              </div>
            ))}
            <p className="rounded-lg border border-edge/60 bg-surface-2/50 p-3 text-[11px] text-muted">
              🚨 WA offline + task overdue = dua bahaya utama. Fix keduanya sebelum launch kampanye baru.
            </p>
          </CardBody>
        </Card>

        {/* Response rate — placeholder sampai ada log */}
        <Card>
          <CardHeader title="Response Rate per Step" subtitle="Berapa % kontak balas setelah tiap FU" />
          <CardBody className="space-y-4">
            {[
              { step: "FU1", color: "bg-info" },
              { step: "FU2", color: "bg-violet" },
              { step: "FU3", color: "bg-accent" },
            ].map((r) => (
              <div key={r.step}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">Setelah {r.step}</span>
                  <span className="font-extrabold text-muted">— (butuh bridge WA)</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-edge/30">
                  <div className={cn("h-full rounded-full", r.color)} style={{ width: "0%" }} />
                </div>
              </div>
            ))}
            <p className="rounded-lg border border-edge/60 bg-surface-2/50 p-3 text-[11px] text-muted">
              💡 Response rate aktif setelah bridge WA terhubung dan pesan mulai masuk ke DB.
            </p>
          </CardBody>
        </Card>
      </div>

      {/* Insight dinamis */}
      <Card className="mt-4">
        <CardHeader title="Insight" subtitle="Rekomendasi otomatis dari data real" />
        <CardBody className="space-y-2.5">
          {insights.map((ins) => (
            <div key={ins.text} className="flex items-center gap-3 rounded-lg border border-edge/60 bg-surface-2/50 px-4 py-3">
              <span className="text-lg">{ins.icon}</span>
              <span className={cn("text-sm font-semibold", ins.color)}>{ins.text}</span>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}

