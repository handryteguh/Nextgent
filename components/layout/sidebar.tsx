"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

// ── Badge data dari /api/summary ─────────────────────────────────────────────
type SummaryData = {
  tasks: { overdue: number };
  followup: { active: number };
};

function useSummary() {
  const [data, setData] = useState<SummaryData | null>(null);
  const fetch_ = useCallback(async () => {
    try {
      const res = await fetch("/api/summary", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setData(json.data);
      }
    } catch {
      // silent — badge gak muncul kalau gagal
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => { if (!cancelled) await fetch_(); };
    tick();
    const interval = setInterval(tick, 30_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [fetch_]);

  return data;
}

// ── Nav items ─────────────────────────────────────────────────────────────────
const navItems = [
  {
    name: "Dashboard",
    href: "/",
    icon: (active: boolean) => (
      <svg className={cn("h-[18px] w-[18px]", active ? "text-[#0B0E14]" : "text-faint")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V10" />
      </svg>
    ),
  },
  {
    name: "Inbox",
    href: "/inbox",
    badgeKey: null as null, // inbox badge butuh bridge — static "0" dulu
    icon: (active: boolean) => (
      <svg className={cn("h-[18px] w-[18px]", active ? "text-[#0B0E14]" : "text-faint")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8m-8 4h5m-9 6h16a2 2 0 002-2V6a2 2 0 00-2-2H4a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    name: "Contacts",
    href: "/contacts",
    icon: (active: boolean) => (
      <svg className={cn("h-[18px] w-[18px]", active ? "text-[#0B0E14]" : "text-faint")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    name: "Follow-up",
    href: "/followup",
    badgeKey: "followup" as const,
    icon: (active: boolean) => (
      <svg className={cn("h-[18px] w-[18px]", active ? "text-[#0B0E14]" : "text-faint")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    name: "Deals",
    href: "/deals",
    icon: (active: boolean) => (
      <svg className={cn("h-[18px] w-[18px]", active ? "text-[#0B0E14]" : "text-faint")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
      </svg>
    ),
  },
  {
    name: "Tasks",
    href: "/tasks",
    badgeKey: "tasks" as const,
    icon: (active: boolean) => (
      <svg className={cn("h-[18px] w-[18px]", active ? "text-[#0B0E14]" : "text-faint")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    name: "Automation",
    href: "/automation",
    icon: (active: boolean) => (
      <svg className={cn("h-[18px] w-[18px]", active ? "text-[#0B0E14]" : "text-faint")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2" />
      </svg>
    ),
  },
  {
    name: "Reports",
    href: "/reports",
    icon: (active: boolean) => (
      <svg className={cn("h-[18px] w-[18px]", active ? "text-[#0B0E14]" : "text-faint")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    name: "Settings",
    href: "/settings",
    icon: (active: boolean) => (
      <svg className={cn("h-[18px] w-[18px]", active ? "text-[#0B0E14]" : "text-faint")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

// ── Badge helper ───────────────────────────────────────────────────────────────
function NavBadge({ count, danger }: { count: number; danger?: boolean }) {
  if (count === 0) return null;
  return (
    <span className={cn(
      "ml-auto flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-extrabold",
      danger
        ? "bg-danger text-white"
        : "bg-accent text-[#0B0E14]"
    )}>
      {count > 99 ? "99+" : count}
    </span>
  );
}

// ── Sidebar ────────────────────────────────────────────────────────────────────
export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const summary = useSummary();

  function getBadge(item: typeof navItems[number]): { count: number; danger: boolean } | null {
    if (!("badgeKey" in item) || !item.badgeKey || !summary) return null;
    if (item.badgeKey === "tasks") return { count: summary.tasks.overdue, danger: true };
    if (item.badgeKey === "followup") return { count: summary.followup.active, danger: false };
    return null;
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <aside className="flex h-full w-56 flex-col border-r border-edge bg-surface">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 border-b border-edge px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-accent-hover shadow-[0_0_12px_rgba(99,102,241,0.4)]">
          <svg className="h-4 w-4 text-[#0B0E14]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <span className="text-sm font-extrabold tracking-tight text-slate-100">Mina-UI</span>
        <span className="ml-auto rounded bg-accent/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-accent">Beta</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <div className="space-y-0.5">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            const badge = getBadge(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                  active
                    ? "bg-accent text-[#0B0E14] shadow-[0_0_12px_rgba(99,102,241,0.25)]"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
                )}
              >
                {item.icon(active)}
                <span className="flex-1">{item.name}</span>
                {badge && <NavBadge count={badge.count} danger={badge.danger} />}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User */}
      <div className="border-t border-edge p-3">
        <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-hover text-sm font-extrabold text-[#0B0E14]">
            H
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-slate-100">Handry</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-faint">Owner</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-faint transition-colors hover:text-danger"
            title="Logout"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
