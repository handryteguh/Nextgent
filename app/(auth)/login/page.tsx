"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [pin, setPin] = useState("");
  const [tries, setTries] = useState(0);
  const [locked, setLocked] = useState(false);
  const [countdown, setCountdown] = useState(300); // 5 menit

  // Statis Phase 0: simulasi verifikasi (pin apa pun di atas 4 digit diterima)
  const handleVerifyPin = () => {
    setTries((t) => t + 1);
    if (tries + 1 >= 5) {
      setLocked(true);
      // hitung mundur sederhana (statis, gak beneran jalan di Phase 0)
      setCountdown(300);
      return;
    }
    setStep(2);
  };

  const handleVerifyOtp = () => {
    // Phase 0: langsung ke dashboard (belum ada backend)
    router.push("/");
  };

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

          {/* Stepper */}
          <div className="mb-6 flex items-center justify-center gap-2">
            <span
              className={cn(
                "h-1.5 rounded-full transition-all",
                step === 1 ? "w-8 bg-accent" : "w-4 bg-edges/60"
              )}
            />
            <span
              className={cn(
                "h-1.5 rounded-full transition-all",
                step === 2 ? "w-8 bg-accent" : "w-4 bg-slate-600"
              )}
            />
          </div>

          {/* Step label */}
          <p className="mb-4 text-center text-xs font-semibold uppercase tracking-wider text-muted">
            <span className="text-accent">LANGKAH {step} </span>
            — {step === 1 ? "MASUKIN PIN" : "VERIFIKASI"}
          </p>

          {step === 1 ? (
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
                disabled={locked}
                className="text-center text-lg tracking-[0.5em]"
                maxLength={6}
              />
              {tries > 0 && !locked && (
                <p className="mt-2 text-center text-xs text-danger">
                  PIN salah — percobaan ke-{tries}/5
                </p>
              )}
              {locked && (
                <div className="mt-3 rounded-lg border border-danger/30 bg-danger/10 p-3 text-center">
                  <p className="text-xs font-bold text-danger">🔒 Terlalu banyak percobaan</p>
                  <p className="mt-1 text-xs text-muted">
                    Coba lagi dalam {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, "0")}
                  </p>
                </div>
              )}
              <Button
                className="mt-4 w-full py-2.5"
                size="lg"
                disabled={locked || pin.length < 4}
                onClick={handleVerifyPin}
              >
                Verifikasi PIN
              </Button>
              {!locked && tries > 0 && (
                <button
                  onClick={() => setTries(0)}
                  className="mt-3 w-full text-center text-xs text-muted hover:text-slate-200"
                >
                  Reset percobaan
                </button>
              )}
            </>
          ) : (
            <>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-muted">
                🔐 Kode Verifikasi (2FA)
              </label>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="••••••"
                maxLength={6}
                className="text-center text-lg tracking-[0.5em]"
              />
              <p className="mt-2 text-center text-xs text-muted">
                Masukkan kode dari aplikasi autentikator (statis di Phase 0)
              </p>
              <Button className="mt-4 w-full py-2.5" size="lg" onClick={handleVerifyOtp}>
                Masuk Dashboard
              </Button>
              <button
                onClick={() => setStep(1)}
                className="mt-3 w-full text-center text-xs text-muted hover:text-slate-200"
              >
                ← Kembali
              </button>
            </>
          )}
        </div>

        <p className="mt-4 text-center text-[11px] font-medium text-faint">
          Mina-UI v0.1 · 🔒 Koneksi terenkripsi
        </p>
      </div>
    </div>
  );
}