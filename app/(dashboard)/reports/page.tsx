import { PageHeader } from "@/components/layout/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { KpiCard } from "@/components/ui/kpi-card";

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

export default function ReportsPage() {
  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Laporan performa follow-up & aktivitas"
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Response Rate" value="68%" sub="+5% dari minggu lalu" color="success" icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        <KpiCard label="Deals Won" value="Rp 4,2jt" sub="5 deal bulan ini" color="accent" icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        <KpiCard label="Unsubscribe" value="12" sub="2,1% total kirim" color="danger" icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>} />
        <KpiCard label="Chat Vol" value="491" sub="14 hari terakhir" color="violet" icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8m-8 4h5m-9 6h16a2 2 0 002-2V6a2 2 0 00-2-2H4a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* Bar chart mingguan */}
        <Card>
          <CardHeader title="Aktivitas Chat per Hari" subtitle="7 hari terakhir — masuk vs keluar" />
          <CardBody>
            <BarChart />
          </CardBody>
        </Card>

        {/* Funnel follow-up */}
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
      </div>
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