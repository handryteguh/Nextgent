"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { KpiCard } from "@/components/ui/kpi-card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ⚠️ Prototipe statis Phase 0 — data dummy. Range waktu cuma simulasi UI.

const daily = {
  labels: ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"],
  masuk: [12, 18, 15, 22, 19, 25, 20],
  keluar: [8, 11, 9, 14, 12, 16, 13],
};

const funnel = [
  { step: "Masuk Sequence", value: 314, pct: 100 },
  { step: "FU1 Terkirim", value: 242, pct: 77 },
  { step: "FU2 Terkirim", value: 156, pct: 50 },
  { step: "FU3 Terkirim", value: 89, pct: 28 },
  { step: "Balas / Convert", value: 214, pct: 68 },
];

const responseRate = [
  { step: "FU1", rate: "30%", bar: 30, color: "bg-info" },
  { step: "FU2", rate: "20%", bar: 20, color: "bg-violet" },
  { step: "FU3", rate: "10%", bar: 10, color: "bg-accent" },
];

const ranges = ["Hari Ini", "7 Hari", "30 Hari", "Kustom"] as const;
type RangeKey = (typeof ranges)[number];

export default function ReportsPage() {
  const [range, setRange] = useState<RangeKey>("7 Hari");

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

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <KpiCard label="Response Rate" value="68%" sub="+5% dari minggu lalu" color="success" icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        <KpiCard label="Deals Won" value="Rp 4,2jt" sub="5 deal bulan ini" color="accent" icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        <KpiCard label="Unsubscribe" value="12" sub="2,1% total kirim" color="danger" icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>} />
        <KpiCard label="Chat Vol" value="491" sub="14 hari terakhir" color="violet" icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8m-8 4h5m-9 6h16a2 2 0 002-2V6a2 2 0 00-2-2H4a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} />
      </div>

      {/* Range label */}
      <p className="mb-4 text-xs font-semibold text-muted">
        Menampilkan data <span className="font-bold text-accent">{range}</span> — semua KPI, chart & insight ikut range.
      </p>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* Bar chart mingguan */}
        <Card>
          <CardHeader title="Aktivitas Chat per Hari" subtitle="7 hari terakhir — masuk vs keluar" />
          <CardBody>
            <BarChart />
          </CardBody>
        </Card>

        {/* Follow-up funnel */}
        <Card>
          <CardHeader title="Follow-up Funnel" subtitle="Dari masuk sequence sampai balas" />
          <CardBody className="space-y-3">
            {funnel.map((f, i) => (
              <div key={f.step}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">
                    {i + 1}. {f.step}
                  </span>
                  <span className="font-bold text-slate-100">
                    {f.value} <span className="font-normal text-faint">({f.pct}%)</span>
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-edge/30">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-accent/70 to-accent"
                    style={{ width: `${f.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </CardBody>
        </Card>

        {/* Response rate per step */}
        <Card>
          <CardHeader title="Response Rate per Step" subtitle="Berapa % kontak balas setelah tiap FU" />
          <CardBody className="space-y-4">
            {responseRate.map((r) => (
              <div key={r.step}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">Setelah {r.step}</span>
                  <span className="font-extrabold text-slate-100">{r.rate}</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-edge/30">
                  <div className={cn("h-full rounded-full", r.color)} style={{ width: `${r.bar}%` }} />
                </div>
              </div>
            ))}
            <p className="rounded-lg border border-edge/60 bg-surface-2/50 p-3 text-[11px] text-muted">
              💡 Buat optimasi template & timing: kalau FU1 rendah, cek template pembuka; kalau FU2 turun drastis, cek jeda & nilai tawaran.
            </p>
          </CardBody>
        </Card>

        {/* Health indicator */}
        <Card>
          <CardHeader title="Health Indicator" subtitle="Tanda bahaya sebelum kena banned" />
          <CardBody className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-edge/60 bg-surface-2/50 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="h-2.5 w-2.5 rounded-full bg-success" />
                <div>
                  <p className="text-sm font-bold text-slate-100">Status WA</p>
                  <p className="text-[11px] text-muted">Bridge di VPS</p>
                </div>
              </div>
              <Badge variant="success">Connected</Badge>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-edge/60 bg-surface-2/50 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="h-2.5 w-2.5 rounded-full bg-success" />
                <div>
                  <p className="text-sm font-bold text-slate-100">Kirim Gagal</p>
                  <p className="text-[11px] text-muted">Total 3 · hari ini 0 — normal</p>
                </div>
              </div>
              <Badge variant="success">Normal</Badge>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-edge/60 bg-surface-2/50 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className={cn("h-2.5 w-2.5 rounded-full", "bg-orange")} />
                <div>
                  <p className="text-sm font-bold text-slate-100">Unsubscribe</p>
                  <p className="text-[11px] text-muted">12 total · 4 minggu ini — naik 3 dari minggu lalu</p>
                </div>
              </div>
              <Badge variant="warning">Perhatian</Badge>
            </div>

            <p className="rounded-lg border border-edge/60 bg-surface-2/50 p-3 text-[11px] text-muted">
              🚨 Kalau kirim gagal atau unsubscribe naik signifikan = tanda pesan kegedean. Turunkan volume / revisi template.
            </p>
          </CardBody>
        </Card>
      </div>

      {/* Actionable insight */}
      <Card className="mt-4">
        <CardHeader title="Insight" subtitle="Rekomendasi otomatis dari data" />
        <CardBody className="space-y-2.5">
          {[
            { icon: "⏰", text: "12 kontak nunggu FU2 — cek template follow-up", color: "text-info" },
            { icon: "⚠️", text: "3 kirim gagal — verifikasi nomor kontak", color: "text-danger" },
            { icon: "💰", text: "5 deal di Negotiation — follow-up minggu ini", color: "text-accent" },
          ].map((i) => (
            <div key={i.text} className="flex items-center gap-3 rounded-lg border border-edge/60 bg-surface-2/50 px-4 py-3">
              <span className="text-lg">{i.icon}</span>
              <span className={cn("text-sm font-semibold", i.color)}>{i.text}</span>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}

function BarChart() {
  const W = 560;
  const H = 220;
  const P = { l: 36, r: 12, t: 12, b: 30 };
  const max = Math.max(...daily.masuk, ...daily.keluar) * 1.15;
  const groupW = (W - P.l - P.r) / daily.labels.length;
  const barW = Math.min(14, groupW / 3);

  const y = (v: number) => P.t + H - P.b - (v / max) * (H - P.t - P.b);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <line key={f} x1={P.l} x2={W - P.r} y1={P.t + H - P.b - f * (H - P.t - P.b)} y2={P.t + H - P.b - f * (H - P.t - P.b)} stroke="#1E293B" strokeWidth="0.5" />
      ))}
      {daily.labels.map((d, i) => {
        const cx = P.l + i * groupW + groupW / 2;
        return (
          <g key={d}>
            <rect x={cx - barW - 2} y={y(daily.masuk[i])} width={barW} height={P.t + H - P.b - y(daily.masuk[i])} rx="4" fill="#22D3EE" opacity="0.85" />
            <rect x={cx + 2} y={y(daily.keluar[i])} width={barW} height={P.t + H - P.b - y(daily.keluar[i])} rx="4" fill="#F5C044" opacity="0.85" />
            <text x={cx} y={H - 8} textAnchor="middle" fontSize="9" fill="#475569" fontFamily="Inter, sans-serif">{d}</text>
          </g>
        );
      })}
    </svg>
  );
}