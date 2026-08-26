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
      {/* Sidebar — desktop (md+) */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Konten: mobile full-width, desktop geser ke kanan sidebar */}
      <main className="pb-20 md:ml-60 md:min-h-screen md:px-8 md:py-6">
        <div className="px-4 py-4 md:px-0 md:py-0">{children}</div>
      </main>

      {/* Bottom nav — mobile only */}
      <BottomNav />
    </div>
  );
}