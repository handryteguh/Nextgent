"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [locked, setLocked] = useState(false);
  const [countdown, setCountdown] = useState(0); // detik
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // isLocked = true kalau countdown masih jalan atau locked flag aktif
  const isLocked = locked || countdown > 0;

  // Hitung mundur lockout
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  const handleVerifyPin = useCallback(async () => {
    if (loading || isLocked) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.ok) {
        // Login sukses → dashboard
        router.replace("/");
        router.refresh();
        return;
      }

      if (res.status === 429 && data.locked) {
        setLocked(true);
        setCountdown(data.minutes * 60);
        setError(data.error);
        return;
      }

      if (res.status === 401) {
        const remaining = data.remaining ?? 0;
        setError(
          remaining > 0
            ? `PIN salah — sisa ${remaining} percobaan`
            : data.error || "PIN salah"
        );
        setPin("");
        return;
      }

      setError(data.error || "Gagal login, coba lagi");
    } catch {
      setError("Gagal terhubung ke server");
    } finally {
      setLoading(false);
    }
  }, [pin, loading, isLocked, router]);

  // Submit dengan Enter
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !loading && !isLocked) handleVerifyPin();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleVerifyPin, loading, isLocked]);

  const fmt = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-base px-4">
      {/* Grid samar ala referensi */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(#1e293b22 1px, transparent 1px), linear-gradient(90deg, #1e293b22 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative w-full max-w-sm">
        {/* Card login */}
        <div className="rounded-2xl border border-edge bg-surface p-8 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
          {/* Brand */}
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent shadow-[0_0_30px_rgba(245,192,68,0.3)]">
              <svg className="h-7 w-7 text-[#0B0E14]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <h1 className="mt-3 text-xl font-extrabold tracking-tight">
              <span className="text-slate-100">Mina</span>
              <span className="text-accent">-UI</span>
            </h1>
            <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-faint">
              CRM + WA Follow-up
            </p>
          </div>

          {/* Step label */}
          <p className="mb-4 text-center text-xs font-semibold uppercase tracking-wider text-muted">
            — MASUKIN PIN
          </p>

          <>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-muted">
              🔑 Master PIN
            </label>
            <Input
              type="password"
              inputMode="numeric"
              placeholder="••••••"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              disabled={isLocked || loading}
              className="text-center text-lg tracking-[0.5em]"
              maxLength={8}
            />
            {error && !isLocked && (
              <p className="mt-2 text-center text-xs text-danger">{error}</p>
            )}
            {isLocked && (
              <div className="mt-3 rounded-lg border border-danger/30 bg-danger/10 p-3 text-center">
                <p className="text-xs font-bold text-danger">🔒 Terlalu banyak percobaan</p>
                <p className="mt-1 text-xs text-muted">
                  Coba lagi dalam {fmt(countdown)}
                </p>
              </div>
            )}
            <Button
              className="mt-4 w-full py-2.5"
              size="lg"
              disabled={isLocked || loading || pin.length < 4}
              onClick={handleVerifyPin}
            >
              {loading ? "Memverifikasi…" : "Verifikasi PIN"}
            </Button>
          </>
        </div>

        <p className="mt-4 text-center text-[11px] font-medium text-faint">
          Mina-UI v0.1 · 🔒 Koneksi terenkripsi
        </p>
      </div>
    </div>
  );
}