"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ⚠️ Prototipe statis Phase 0 — status bridge masih simulasi.
// Nanti di Phase 1: baca dari GET /status di bridge (VPS).
type BridgeStatus = "disconnected" | "connecting" | "connected" | "reconnecting" | "logged_out";

const statusMeta: Record<BridgeStatus, { label: string; variant: "default" | "success" | "danger" | "warning" | "info"; dot: string; desc: string }> = {
  disconnected: { label: "○ Belum Connect", variant: "danger", dot: "bg-danger", desc: "Belum ada nomor WA terhubung ke bridge." },
  connecting: { label: "● Menghubungkan...", variant: "warning", dot: "bg-orange", desc: "Bridge sedang socket handshake dengan WhatsApp." },
  connected: { label: "● Terhubung", variant: "success", dot: "bg-success", desc: "Bridge siap kirim & terima pesan." },
  reconnecting: { label: "● Menghubungkan Ulang...", variant: "warning", dot: "bg-orange", desc: "Socket putus, bridge nyoba balik otomatis." },
  logged_out: { label: "○ Session Expired", variant: "danger", dot: "bg-danger", desc: "Session di-revoke dari HP / expired. Scan QR ulang di UI bridge." },
};

export default function SettingsPage() {
  // Simulasi: dropdown biar bisa preview semua state (Phase 0)
  const [waStatus, setWaStatus] = useState<BridgeStatus>("connected");

  const st = statusMeta[waStatus];

  return (
    <div>
      <PageHeader title="Pengaturan" subtitle="Konfigurasi aplikasi & koneksi WhatsApp (statis)" />

      {/* Banner disconnect → sequence pause (sesuai PRD 5.1) */}
      {waStatus !== "connected" && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-danger/30 bg-danger/10 px-5 py-3.5">
          <div className="flex items-center gap-3">
            <span className={cn("h-2.5 w-2.5 rounded-full", st.dot)} />
            <div>
              <p className="text-sm font-bold text-danger">WhatsApp terputus — semua sequence DI-PAUSE</p>
              <p className="text-xs text-muted">
                Follow-up otomatis dihentikan sementara. Resume manual setelah reconnect.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setWaStatus("connecting")}>
              Cek Ulang Status
            </Button>
            <Button variant="primary" size="sm" onClick={() => setWaStatus("connected")}>
              Simulasi Connect
            </Button>
          </div>
        </div>
      )}

      {/* Settings grid — mobile: stack, desktop: 2 kolom */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* Koneksi WhatsApp — status bridge, BUKAN QR sendiri (PRD v0.4) */}
        <Card>
          <CardHeader
            title="Koneksi WhatsApp"
            subtitle="Status bridge di VPS — QR connect tetap di Hermes/Bridge"
            action={<Badge variant={st.variant}>{st.label}</Badge>}
          />
          <CardBody className="space-y-4">
            {/* Simulasi status bridge (Phase 0) */}
            <div>
              <Label>Status Bridge (simulasi Phase 0)</Label>
              <select
                value={waStatus}
                onChange={(e) => setWaStatus(e.target.value as BridgeStatus)}
                className="w-full rounded-lg border border-edge bg-surface-2 px-3 py-2 text-sm text-slate-100 focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/40"
              >
                <option value="disconnected">disconnected — belum connect</option>
                <option value="connecting">connecting — socket handshake</option>
                <option value="connected">connected — siap kirim & terima</option>
                <option value="reconnecting">reconnecting — socket putus</option>
                <option value="logged_out">logged_out — session expired/revoke</option>
              </select>
              <p className="mt-1.5 text-xs text-faint">{st.desc}</p>
            </div>

            {waStatus === "connected" ? (
              <div className="rounded-lg border border-success/25 bg-success/5 p-4">
                <p className="text-sm font-bold text-success">WhatsApp terhubung ✅</p>
                <p className="mt-1 text-xs text-muted">Nomor: +62 812-3456-7890 · Session tersimpan di VPS (bridge)</p>
                <div className="mt-3 flex gap-2">
                  <Button variant="outline" size="sm">Buka UI Bridge</Button>
                  <Button variant="danger" size="sm">Logout / Putuskan</Button>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-edge/60 bg-surface-2/50 p-4">
                <p className="text-sm font-semibold text-slate-200">Scan QR di Hermes/Bridge</p>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  Mina-UI gak bikin QR connect sendiri — QR lifecycle tanggung jawab bridge.
                  Buka UI bridge di VPS, scan sekali, session tersimpan otomatis.
                </p>
                <Button variant="outline" size="sm" className="mt-3">🔗 Buka UI Bridge →</Button>
              </div>
            )}

            <div className="rounded-lg border border-edge/60 bg-surface-2/50 p-3 text-[11px] text-muted">
              <p className="font-bold uppercase tracking-wider text-faint">State status bridge</p>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                {Object.entries(statusMeta).map(([key, s]) => (
                  <span key={key} className="flex items-center gap-1.5">
                    <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
                    {key} — {s.label.replace(/[○●]/g, "").trim()}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-faint">⚠️ Disconnect → semua sequence PAUSE (resume manual).</p>
            </div>
          </CardBody>
        </Card>

        {/* Sequence settings */}
        <Card>
          <CardHeader title="Follow-up Default" subtitle="Interval & jam kirim safety engine" />
          <CardBody className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>FU1 (jam)</Label>
                <Input type="number" defaultValue={24} />
              </div>
              <div>
                <Label>FU2 (jam)</Label>
                <Input type="number" defaultValue={72} />
              </div>
              <div>
                <Label>FU3 (jam)</Label>
                <Input type="number" defaultValue={168} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Jam Mulai Kirim</Label>
                <Input type="time" defaultValue="08:00" />
              </div>
              <div>
                <Label>Jam Berhenti</Label>
                <Input type="time" defaultValue="20:00" />
              </div>
            </div>
            <div className="rounded-lg border border-edge/60 bg-surface-2/50 p-3 text-xs text-muted">
              🎲 Delay random ±20% otomatis · max 1 pesan/kontak/hari · unsubscribe-aware · timezone WIB
            </div>
            <Button variant="outline" className="w-full">Simpan Pengaturan</Button>
          </CardBody>
        </Card>

        {/* Keamanan */}
        <Card>
          <CardHeader title="Keamanan" subtitle="Kebijakan login & proteksi" />
          <CardBody className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Maks Percobaan Login</Label>
                <Input type="number" defaultValue={5} />
              </div>
              <div>
                <Label>Cooldown (menit)</Label>
                <Input type="number" defaultValue={5} />
              </div>
            </div>
            <div className="rounded-lg border border-edge/60 bg-surface-2/50 p-3 text-xs text-muted">
              Setelah 5x salah → lockout: form disabled + hitung mundur. Login sukses me-reset counter.
            </div>
            <Button variant="outline" className="w-full">Ganti Master PIN</Button>
          </CardBody>
        </Card>

        {/* Tentang */}
        <Card>
          <CardHeader title="Tentang" subtitle="Informasi aplikasi" />
          <CardBody className="space-y-3 text-sm">
            <div className="flex justify-between rounded-lg border border-edge/60 bg-surface-2/50 px-4 py-3">
              <span className="text-muted">Versi</span>
              <span className="font-bold text-slate-100">v0.1.0 (Phase 0 — Frontend Statis)</span>
            </div>
            <div className="flex justify-between rounded-lg border border-edge/60 bg-surface-2/50 px-4 py-3">
              <span className="text-muted">Database</span>
              <span className="font-bold text-slate-100">SQLite + Drizzle ORM (belum aktif)</span>
            </div>
            <div className="flex justify-between rounded-lg border border-edge/60 bg-surface-2/50 px-4 py-3">
              <span className="text-muted">WA Bridge</span>
              <span className="font-bold text-slate-100">VPS solusiadmin-core-vps</span>
            </div>
            <div className="flex justify-between rounded-lg border border-edge/60 bg-surface-2/50 px-4 py-3">
              <span className="text-muted">SSOT UI</span>
              <span className="font-bold text-slate-100">D:\DOCUMENT\Mina-UI-SSOT</span>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}