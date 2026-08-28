"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ============================================================
// Types
// ============================================================
type BridgeStatus = "disconnected" | "connecting" | "connected" | "reconnecting" | "logged_out";

interface AppSettings {
  fu_delay_1: string;
  fu_delay_2: string;
  fu_delay_3: string;
  send_start: string;
  send_stop: string;
  app_version: string;
  tailscale_ip?: string;
  tailscale_port?: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  fu_delay_1: "24",
  fu_delay_2: "72",
  fu_delay_3: "168",
  send_start: "08:00",
  send_stop: "20:00",
  app_version: "0.1.0",
};

const statusMeta: Record<BridgeStatus, { label: string; variant: "default" | "success" | "danger" | "warning" | "info"; dot: string; desc: string }> = {
  disconnected: { label: "○ Belum Connect", variant: "danger", dot: "bg-danger", desc: "Belum ada nomor WA terhubung ke bridge." },
  connecting: { label: "● Menghubungkan...", variant: "warning", dot: "bg-orange", desc: "Bridge sedang socket handshake dengan WhatsApp." },
  connected: { label: "● Terhubung", variant: "success", dot: "bg-success", desc: "Bridge siap kirim & terima pesan." },
  reconnecting: { label: "● Menghubungkan Ulang...", variant: "warning", dot: "bg-orange", desc: "Socket putus, bridge nyoba balik otomatis." },
  logged_out: { label: "○ Session Expired", variant: "danger", dot: "bg-danger", desc: "Session di-revoke dari HP / expired. Scan QR ulang di UI bridge." },
};

// ============================================================
// Komponen kecil: row setting dengan label
// ============================================================
function SettingRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 py-3 border-b border-edge/40 last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-200">{label}</p>
        {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

// ============================================================
// Halaman Pengaturan
// ============================================================
export default function SettingsPage() {
  // WA Bridge — simulasi Phase 0 (bridge belum ada)
  const [waStatus] = useState<BridgeStatus>("disconnected");
  const st = statusMeta[waStatus];

  // Settings dari DB
  const [cfg, setCfg] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [cfgLoading, setCfgLoading] = useState(true);
  const [cfgSaving, setCfgSaving] = useState(false);
  const [cfgMsg, setCfgMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Ganti PIN
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinLoading, setPinLoading] = useState(false);
  const [pinMsg, setPinMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Load settings dari DB
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/settings");
        const json = await res.json();
        if (json.data) setCfg({ ...DEFAULT_SETTINGS, ...json.data });
      } catch { /* silent */ }
      finally { setCfgLoading(false); }
    })();
  }, []);

  const handleSaveSettings = async () => {
    setCfgSaving(true);
    setCfgMsg(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fu_delay_1: cfg.fu_delay_1,
          fu_delay_2: cfg.fu_delay_2,
          fu_delay_3: cfg.fu_delay_3,
          send_start: cfg.send_start,
          send_stop: cfg.send_stop,
          tailscale_ip: cfg.tailscale_ip ?? "",
          tailscale_port: cfg.tailscale_port ?? "3001",
        }),
      });
      const json = await res.json();
      if (!res.ok) { setCfgMsg({ type: "err", text: json.error || "Gagal menyimpan" }); return; }
      setCfgMsg({ type: "ok", text: `Tersimpan (${json.saved?.join(", ")})` });
    } catch {
      setCfgMsg({ type: "err", text: "Gagal terhubung ke server" });
    } finally {
      setCfgSaving(false);
    }
  };

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinMsg(null);
    if (newPin !== confirmPin) {
      setPinMsg({ type: "err", text: "Konfirmasi PIN tidak cocok" });
      return;
    }
    setPinLoading(true);
    try {
      const res = await fetch("/api/auth/change-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPin, newPin }),
      });
      const json = await res.json();
      if (!res.ok) { setPinMsg({ type: "err", text: json.error || "Gagal ganti PIN" }); return; }
      setPinMsg({ type: "ok", text: "PIN berhasil diganti!" });
      setCurrentPin(""); setNewPin(""); setConfirmPin("");
    } catch {
      setPinMsg({ type: "err", text: "Gagal terhubung ke server" });
    } finally {
      setPinLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Pengaturan" subtitle="Konfigurasi aplikasi & koneksi WhatsApp" />

      {/* Banner WA disconnect */}
      {waStatus !== "connected" && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-danger/30 bg-danger/10 px-5 py-3.5">
          <div className="flex items-center gap-3">
            <span className={cn("h-2.5 w-2.5 rounded-full", st.dot)} />
            <div>
              <p className="text-sm font-bold text-danger">WhatsApp terputus — semua sequence DI-PAUSE</p>
              <p className="text-xs text-muted">Follow-up otomatis dihentikan sementara. Resume manual setelah reconnect.</p>
            </div>
          </div>
          <Button size="sm" variant="ghost" className="border border-danger/40 text-danger hover:bg-danger/10">
            Reconnect
          </Button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">

        {/* 1. Koneksi WhatsApp */}
        <Card>
          <CardHeader
            title="📱 Koneksi WhatsApp"
            action={<Badge variant={st.variant}>{st.label}</Badge>}
          />
          <CardBody className="space-y-4">
            <p className="text-xs text-muted">{st.desc}</p>
            <div className="rounded-lg border border-edge/60 bg-surface-2/50 px-4 py-3 text-xs text-muted">
              Bridge WA akan tersedia setelah integrasi VPS selesai (Phase 3). Saat ini semua sequence berjalan manual.
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" className="flex-1" disabled>
                Scan QR
              </Button>
              <Button size="sm" variant="ghost" className="flex-1" disabled>
                Disconnect
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* 2. Follow-up Default */}
        <Card>
          <CardHeader
            title="⏱️ Follow-up Default"
            action={cfgMsg ? (
              <span className={cn("text-xs font-semibold", cfgMsg.type === "ok" ? "text-success" : "text-danger")}>
                {cfgMsg.type === "ok" ? "✓" : "✗"} {cfgMsg.text}
              </span>
            ) : undefined}
          />
          <CardBody>
            {cfgLoading ? (
              <p className="py-4 text-center text-sm text-muted">Memuat…</p>
            ) : (
              <>
                <SettingRow label="FU1 — Delay" hint="Jam setelah kontak masuk">
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number" min={1} max={720}
                      value={cfg.fu_delay_1}
                      onChange={(e) => setCfg((c) => ({ ...c, fu_delay_1: e.target.value }))}
                      className="w-20 text-center"
                    />
                    <span className="text-xs text-muted">jam</span>
                  </div>
                </SettingRow>
                <SettingRow label="FU2 — Delay" hint="Jam setelah FU1">
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number" min={1} max={720}
                      value={cfg.fu_delay_2}
                      onChange={(e) => setCfg((c) => ({ ...c, fu_delay_2: e.target.value }))}
                      className="w-20 text-center"
                    />
                    <span className="text-xs text-muted">jam</span>
                  </div>
                </SettingRow>
                <SettingRow label="FU3 — Delay" hint="Jam setelah FU2">
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number" min={1} max={720}
                      value={cfg.fu_delay_3}
                      onChange={(e) => setCfg((c) => ({ ...c, fu_delay_3: e.target.value }))}
                      className="w-20 text-center"
                    />
                    <span className="text-xs text-muted">jam</span>
                  </div>
                </SettingRow>
                <SettingRow label="Jam Kirim" hint="Pesan hanya dikirim dalam rentang ini">
                  <div className="flex items-center gap-1.5">
                    <Input type="time" value={cfg.send_start}
                      onChange={(e) => setCfg((c) => ({ ...c, send_start: e.target.value }))}
                      className="w-28" />
                    <span className="text-xs text-muted">s/d</span>
                    <Input type="time" value={cfg.send_stop}
                      onChange={(e) => setCfg((c) => ({ ...c, send_stop: e.target.value }))}
                      className="w-28" />
                  </div>
                </SettingRow>
                <div className="pt-3">
                  <Button onClick={handleSaveSettings} disabled={cfgSaving} className="w-full">
                    {cfgSaving ? "Menyimpan…" : "Simpan Pengaturan FU"}
                  </Button>
                </div>
              </>
            )}
          </CardBody>
        </Card>

        {/* 3. Keamanan — Ganti PIN */}
        <Card>
          <CardHeader title="🔒 Keamanan" />
          <CardBody>
            <form onSubmit={handleChangePin} className="space-y-3">
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-muted">PIN Lama</label>
                <Input
                  type="password" inputMode="numeric" placeholder="••••••"
                  value={currentPin} onChange={(e) => setCurrentPin(e.target.value)}
                  maxLength={8} required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-muted">PIN Baru</label>
                <Input
                  type="password" inputMode="numeric" placeholder="••••••"
                  value={newPin} onChange={(e) => setNewPin(e.target.value)}
                  maxLength={8} required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-muted">Konfirmasi PIN Baru</label>
                <Input
                  type="password" inputMode="numeric" placeholder="••••••"
                  value={confirmPin} onChange={(e) => setConfirmPin(e.target.value)}
                  maxLength={8} required
                />
              </div>
              {pinMsg && (
                <p className={cn("text-xs font-semibold", pinMsg.type === "ok" ? "text-success" : "text-danger")}>
                  {pinMsg.type === "ok" ? "✓" : "✗"} {pinMsg.text}
                </p>
              )}
              <Button type="submit" disabled={pinLoading} className="w-full">
                {pinLoading ? "Memproses…" : "Ganti PIN"}
              </Button>
            </form>
          </CardBody>
        </Card>

        {/* 4. TailScale */}
        <Card>
          <CardHeader title="🔗 TailScale" subtitle="Akses dashboard dari HP / device lain via TailScale" />
          <CardBody className="space-y-4">
            <SettingRow label="TailScale IP" hint="IP laptop kamu di jaringan TailScale (cek di tailscale.com/admin atau app TailScale)">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="100.x.x.x"
                  value={cfg.tailscale_ip ?? ""}
                  onChange={(e) => setCfg((c) => ({ ...c, tailscale_ip: e.target.value }))}
                  className="w-36 font-mono text-sm"
                />
              </div>
            </SettingRow>
            <SettingRow label="Port" hint="Port dev server (default: 3001)">
              <Input
                type="number"
                placeholder="3001"
                value={cfg.tailscale_port ?? "3001"}
                onChange={(e) => setCfg((c) => ({ ...c, tailscale_port: e.target.value }))}
                className="w-24 text-center font-mono"
              />
            </SettingRow>
            {cfg.tailscale_ip && (
              <div className="rounded-lg border border-accent/30 bg-accent/5 p-3">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-accent">URL Akses dari HP</p>
                <p className="font-mono text-sm text-slate-200 break-all">
                  http://{cfg.tailscale_ip}:{cfg.tailscale_port ?? "3001"}
                </p>
                <p className="mt-1 text-[10px] text-faint">
                  Pastikan TailScale aktif di laptop + HP, dan firewall Windows allow port {cfg.tailscale_port ?? "3001"}.
                </p>
              </div>
            )}
            <div className="rounded-lg border border-edge/60 bg-surface-2/50 p-3 text-xs text-muted space-y-1">
              <p className="font-semibold text-slate-300">Cara setup TailScale:</p>
              <ol className="list-decimal pl-4 space-y-0.5">
                <li>Install TailScale di laptop: <span className="text-accent font-mono">tailscale.com/download</span></li>
                <li>Install TailScale di HP (iOS/Android)</li>
                <li>Login dengan akun yang sama di keduanya</li>
                <li>Cek IP laptop di app TailScale atau <span className="text-accent font-mono">tailscale ip -4</span></li>
                <li>Isi IP di atas → akses dari HP via browser</li>
              </ol>
            </div>
            <Button onClick={handleSaveSettings} disabled={cfgSaving} className="w-full">
              {cfgSaving ? "Menyimpan…" : "Simpan TailScale Settings"}
            </Button>
          </CardBody>
        </Card>

        {/* 5. Tentang */}
        <Card>
          <CardHeader title="ℹ️ Tentang Aplikasi" />
          <CardBody className="space-y-2">
            {[
              { label: "Versi", value: `v${cfg.app_version}` },
              { label: "Stack", value: "Next.js 16.3 + React 19 + Tailwind 4" },
              { label: "Database", value: "SQLite + Drizzle ORM ✅" },
              { label: "Auth", value: "PIN (scrypt) + HMAC session cookie" },
              { label: "WA Bridge", value: "Hermes Agent Lokal (via TailScale)" },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between rounded-lg border border-edge/60 bg-surface-2/50 px-4 py-3">
                <span className="text-muted">{label}</span>
                <span className="font-bold text-slate-100">{value}</span>
              </div>
            ))}
          </CardBody>
        </Card>

      </div>
    </div>
  );
}
