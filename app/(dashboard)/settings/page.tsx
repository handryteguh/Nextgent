"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  const [waConnected] = useState(false);
  const [showQr, setShowQr] = useState(false);

  return (
    <div>
      <PageHeader title="Pengaturan" subtitle="Konfigurasi aplikasi & koneksi WhatsApp" />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* Koneksi WhatsApp */}
        <Card>
          <CardHeader
            title="Koneksi WhatsApp"
            subtitle="WA Bridge di VPS — scan sekali, session tersimpan"
            action={
              waConnected ? (
                <Badge variant="success">● Terhubung</Badge>
              ) : (
                <Badge variant="danger">○ Belum Connect</Badge>
              )
            }
          />
          <CardBody className="space-y-4">
            {!waConnected ? (
              <>
                <div className="rounded-lg border border-edge/60 bg-surface-2/50 p-4 text-center">
                  <p className="text-sm text-muted">
                    {showQr ? (
                      <span className="flex flex-col items-center gap-3">
                        <span className="text-xs text-faint">Scan QR ini dengan WhatsApp di HP (Linked Devices)</span>
                        {/* QR dummy statis */}
                        <span className="inline-block border border-edge bg-white p-2">
                          <svg viewBox="0 0 120 120" className="h-40 w-40">
                            {Array.from({ length: 21 }).map((_, r) =>
                              Array.from({ length: 21 }).map((_, c) => {
                                const isFinder = (r < 7 && c < 7) || (r < 7 && c > 13) || (r > 13 && c < 7);
                                const on =
                                  isFinder
                                    ? (r === 0 || r === 6 || c === 0 || c === 6) || ((r >= 2 && r <= 4) && (c >= 2 && c <= 4))
                                    : ((r * 7 + c * 13 + r * c * 3) % 9 < 4);
                                return <rect key={`${r}-${c}`} x={c * 5} y={r * 5} width="4.2" height="4.2" fill={on ? "#0B0E14" : "#fff"} />;
                              })
                            )}
                          </svg>
                        </span>
                        <span className="text-xs text-faint">QR akan refresh otomatis setiap 60 detik</span>
                      </span>
                    ) : (
                      "Belum ada nomor WA terhubung"
                    )}
                  </p>
                </div>
                <Button
                  className="w-full"
                  onClick={() => setShowQr(true)}
                  disabled={showQr}
                >
                  {showQr ? "Menunggu Scan..." : "📱 Connect WhatsApp"}
                </Button>
              </>
            ) : (
              <div className="rounded-lg border border-success/25 bg-success/5 p-4">
                <p className="text-sm font-bold text-success">WhatsApp terhubung ✅</p>
                <p className="mt-1 text-xs text-muted">Nomor: +62 812-3456-7890 · Session tersimpan di VPS</p>
                <div className="mt-3 flex gap-2">
                  <Button variant="outline" size="sm">Ganti Nomor</Button>
                  <Button variant="danger" size="sm">Putuskan</Button>
                </div>
              </div>
            )}
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
              🎲 Delay random ±20% otomatis · max 1 pesan/kontak/hari · unsubscribe-aware
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