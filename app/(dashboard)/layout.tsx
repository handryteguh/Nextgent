"use client";

import { Sidebar } from "@/components/layout/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-base">
      <Sidebar />
      <main className="ml-60 min-h-screen px-8 py-6">{children}</main>
    </div>
  );
}