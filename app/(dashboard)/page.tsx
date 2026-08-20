import { PageHeader } from "@/components/layout/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { KpiCard } from "@/components/ui/kpi-card";
import { Button } from "@/components/ui/button";

// Ikon inline (line style, warna sesuai token)
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
};

// Data dummy statis (Phase 0 — belum nyambung DB)
const kpis = [
  { label: "Total Kontak", value: 1284, sub: "32 baru minggu ini", icon: icons.users, color: "accent" as const },
  { label: "Chat Hari Ini", value: 47, sub: "12 belum dibaca", icon: icons.wa, color: "info" as const },
  { label: "Follow-up Aktif", value: 356, sub: "FU1: 182 · FU2: 98 · FU3: 76", icon: icons.bolt, color: "violet" as const },
  { label: "Response Rate", value: "68%", sub: "+5% dari minggu lalu", icon: icons.userCheck, color: "success" as const },
];

// Data dummy chart — 14 hari terakhir
const days = ["6 Agu", "7 Agu", "8 Agu", "9 Agu", "10 Agu", "11 Agu", "12 Agu", "13 Agu", "14 Agu", "15 Agu", "16 Agu", "17 Agu", "18 Agu", "19 Agu"];
const chatSeries = [28, 35, 31, 42, 38, 45, 52, 48, 44, 56, 61, 58, 63, 70];
const fuSeries = [12, 15, 14, 18, 16, 20, 22, 19, 24, 28, 26, 30, 33, 36];

// Tier distribution (donut)
const tiers = [
  { label: "Siap FU", value: 356, color: "#F5C044" },
  { label: "Balas", value: 214, color: "#34D399" },
  { label: "Menunggu", value: 128, color: "#A78BFA" },
  { label: "Selesai", value: 586, color: "#22D3EE" },
];

export default function DashboardPage() {
  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        actions={<Button variant="outline" size="sm">↻ Refresh</Button>}
      />

      {/* KPI Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <KpiCard key={k.label} label={k.label} value={k.value} sub={k.sub} icon={k.icon} color={k.color} />
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Line chart - chat activity */}
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
                  <span className="h-2 w-2 rounded-full bg-accent" /> Follow-up
                </span>
              </div>
            }
          />
          <CardBody>
            <LineChart days={days} chat={chatSeries} fu={fuSeries} />
          </CardBody>
        </Card>

        {/* Donut chart - status follow-up */}
        <Card>
          <CardHeader title="Status Follow-up" subtitle="Distribusi seluruh kontak" />
          <CardBody className="flex flex-col items-center">
            <DonutChart data={tiers} />
            <div className="mt-5 w-full space-y-2.5">
              {tiers.map((t) => (
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
    </div>
  );
}

// Line chart SVG (spline sederhana)
function LineChart({ days, chat, fu }: { days: string[]; chat: number[]; fu: number[] }) {
  const W = 640;
  const H = 220;
  const P = { l: 36, r: 12, t: 12, b: 30 };
  const max = Math.max(...chat, ...fu) * 1.15;
  const stepX = (W - P.l - P.r) / (days.length - 1);

  const points = (arr: number[]) =>
    arr
      .map((v, i) => `${P.l + i * stepX},${P.t + H - P.b - (v / max) * (H - P.t - P.b)}`)
      .join(" ");
  void points;

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
    const last = arr.length - 1;
    const lastX = P.l + last * stepX;
    const baseY = P.t + H - P.b;
    return `${line} L ${lastX},${baseY} L ${P.l},${baseY} Z`;
  };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
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
      {/* grid */}
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <line
          key={f}
          x1={P.l}
          x2={W - P.r}
          y1={P.t + H - P.b - f * (H - P.t - P.b)}
          y2={P.t + H - P.b - f * (H - P.t - P.b)}
          stroke="#1E293B"
          strokeWidth="0.5"
        />
      ))}
      {/* areas */}
      <path d={areaPath(fu)} fill="url(#gradFu)" />
      <path d={areaPath(chat)} fill="url(#gradChat)" />
      {/* lines */}
      <path d={path(fu)} fill="none" stroke="#F5C044" strokeWidth="2.5" strokeLinecap="round" />
      <path d={path(chat)} fill="none" stroke="#22D3EE" strokeWidth="2.5" strokeLinecap="round" />
      {/* dots */}
      {fu.map((v, i) => (
        <circle key={i} cx={P.l + i * stepX} cy={P.t + H - P.b - (v / max) * (H - P.t - P.b)} r="3" fill="#F5C044" />
      ))}
      {chat.map((v, i) => (
        <circle key={i} cx={P.l + i * stepX} cy={P.t + H - P.b - (v / max) * (H - P.t - P.b)} r="3" fill="#22D3EE" />
      ))}
      {/* x labels */}
      {days.map((d, i) => (
        <text
          key={d}
          x={P.l + i * stepX}
          y={H - 8}
          textAnchor="middle"
          fontSize="9"
          fill="#475569"
          fontFamily="Inter, sans-serif"
        >
          {i % 2 === 0 ? d : ""}
        </text>
      ))}
    </svg>
  );
}

// Donut chart SVG
function DonutChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((a, b) => a + b.value, 0);
  const R = 70;
  const C = 2 * Math.PI * R;

  // Hitung offset kumulatif dengan reduce — tanpa reassign di render
  const segments = data.reduce<{ label: string; value: number; color: string; dash: number; offset: number }[]>(
    (acc, d) => {
      const lastOffset = acc.length > 0 ? acc[acc.length - 1].offset + (acc[acc.length - 1].value / total) * C : 0;
      return [...acc, { ...d, dash: (d.value / total) * C, offset: lastOffset }];
    },
    []
  );

  return (
    <div className="relative">
      <svg viewBox="0 0 180 180" className="h-44 w-44">
        <circle cx="90" cy="90" r={R} fill="none" stroke="#1E293B" strokeWidth="20" />
        {segments.map((d) => (
          <circle
            key={d.label}
            cx="90"
            cy="90"
            r={R}
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
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
          Total
        </span>
      </div>
    </div>
  );
}