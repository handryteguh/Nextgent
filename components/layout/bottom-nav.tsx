"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

// ⚠️ Mobile-first: bottom nav di HP. Desktop (md+) pakai sidebar kiri.
// Nav SELALU di atas (z-50) — sheet "Lainnya" di bawahnya (z-40),
// biar tombol nav tetap bisa diklik walau sheet kebuka.

const bottomItems = [
  { name: "Beranda", href: "/", icon: "M3 12l9-9 9 9M5 10v10a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V10", badge: undefined },
  { name: "Inbox", href: "/inbox", icon: "M8 10h8m-8 4h5m-9 6h16a2 2 0 002-2V6a2 2 0 00-2-2H4a2 2 0 00-2 2v12a2 2 0 002 2z", badge: "12" },
  { name: "Kontak", href: "/contacts", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z", badge: undefined },
  { name: "Follow-up", href: "/followup", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", badge: "3" },
];

// Menu tambahan — dibuka lewat sheet "Lainnya"
const moreItems = [
  { name: "Deals", href: "/deals", icon: "M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2", badge: undefined },
  { name: "Tasks", href: "/tasks", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4", badge: "4" },
  { name: "Automation", href: "/automation", icon: "M13 10V3L4 14h7v7l9-11h-7z", badge: undefined },
  { name: "Reports", href: "/reports", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", badge: undefined },
  { name: "Logs", href: "/logs", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", badge: undefined },
  { name: "Pengaturan", href: "/settings", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z", badge: undefined },
];

function Icon({ d, className }: { d: string; className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  // Pengaman: pathname berubah → sheet dijamin nutup (render-time sync, aman lint).
  // Menangani: klik nav, browser back/forward, navigasi dari luar, dll.
  const [prevPath, setPrevPath] = useState(pathname);
  if (prevPath !== pathname) {
    setPrevPath(pathname);
    if (moreOpen) setMoreOpen(false);
  }

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <>
      {/* Sheet "Lainnya" — z-40, DI BAWAH nav (z-50) */}
      {moreOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Backdrop — ketuk area gelap buat nutup */}
          <div className="absolute inset-0 bg-black/60" onClick={() => setMoreOpen(false)} />
          {/* Panel — muncul di ATAS nav, gak nutupin tombol nav */}
          <div className="absolute inset-x-0 bottom-[76px] rounded-t-2xl border border-edge bg-surface pb-4">
            <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-edge" />
            <p className="px-5 pb-1 pt-4 text-[10px] font-bold uppercase tracking-widest text-faint">
              Menu Lainnya
            </p>
            <div className="grid grid-cols-3 gap-1 p-3">
              {moreItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-[10px] font-bold",
                      active ? "bg-accent/10 text-accent" : "text-muted hover:bg-white/5"
                    )}
                  >
                    <span className="relative">
                      <Icon d={item.icon} className="h-5 w-5" />
                      {item.badge && (
                        <span className="absolute -right-2 -top-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-accent px-0.5 text-[8px] font-extrabold text-[#0B0E14]">
                          {item.badge}
                        </span>
                      )}
                    </span>
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom nav — z-50, SELALU di atas & bisa diklik */}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-edge bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <div className="grid grid-cols-5">
          {bottomItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMoreOpen(false)}
                className={cn(
                  "relative flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold transition-colors",
                  active ? "text-accent" : "text-muted"
                )}
              >
                <span className="relative">
                  <Icon d={item.icon} className="h-5 w-5" />
                  {item.badge && (
                    <span className="absolute -right-2 -top-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-accent px-0.5 text-[8px] font-extrabold text-[#0B0E14]">
                      {item.badge}
                    </span>
                  )}
                </span>
                {item.name}
                {active && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-accent" />}
              </Link>
            );
          })}
          {/* Tombol "Lainnya" — toggle buka/tutup sheet */}
          <button
            onClick={() => setMoreOpen((o) => !o)}
            className={cn(
              "relative flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold transition-colors",
              moreOpen || moreItems.some((m) => isActive(m.href)) ? "text-accent" : "text-muted"
            )}
          >
            <span className="relative">
              <Icon d={moreOpen ? "M6 18L18 6M6 6l12 12" : "M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"} className="h-5 w-5" />
              {!moreOpen && moreItems.some((m) => isActive(m.href)) && (
                <span className="absolute -right-2 -top-1.5 h-3.5 w-3.5 rounded-full bg-accent" />
              )}
            </span>
            {moreOpen ? "Tutup" : "Lainnya"}
            {(moreOpen || moreItems.some((m) => isActive(m.href))) && (
              <span className="absolute top-0 h-0.5 w-8 rounded-full bg-accent" />
            )}
          </button>
        </div>
      </nav>
    </>
  );
}