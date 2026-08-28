"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-base">
      {/* Sidebar — fixed, desktop (md+) */}
      <div className="hidden md:fixed md:inset-y-0 md:left-0 md:z-40 md:block md:w-56">
        <Sidebar />
      </div>

      {/* Konten: mobile full-width, desktop geser ke kanan sidebar w-56 = 224px */}
      <main className="pb-20 md:ml-56 md:min-h-screen md:px-8 md:py-6">
        <div className="px-4 py-4 md:px-0 md:py-0">{children}</div>
      </main>

      {/* Bottom nav — mobile only */}
      <BottomNav />
    </div>
  );
}