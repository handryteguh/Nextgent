"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Data dummy chat (Phase 0)
const chats = [
  { id: 1, name: "Yan Azmi", wa: "628123456001", last: "Oke saya cek dulu ya, makasih infonya", time: "09:32", unread: 2, status: "Balas", online: true },
  { id: 2, name: "Johar Tantowi", wa: "628123456002", last: "Untuk harga paketnya berapa ya?", time: "08:15", unread: 0, status: "FU1", online: false },
  { id: 3, name: "Evi Yuslatin", wa: "628123456003", last: "Baik, nanti saya kabari lagi", time: "Kemarin", unread: 0, status: "FU2", online: false },
  { id: 4, name: "Prasetyo Darmawan", wa: "628123456004", last: "Siap, deal. Kapan mulai bisa? 😄", time: "Kemarin", unread: 0, status: "Balas", online: true },
  { id: 5, name: "Maya Jaya", wa: "628123456005", last: "Makasih ya kak", time: "17 Agu", unread: 0, status: "Selesai", online: false },
  { id: 6, name: "Fajar Servis", wa: "628123456006", last: "Masih minat kok, cuma lagi sibuk", time: "15 Agu", unread: 0, status: "FU1", online: false },
  { id: 7, name: "Ranti Mebel", wa: "628123456007", last: "Sudah tidak perlu, terima kasih", time: "12 Agu", unread: 0, status: "Unsub", online: false },
];

const messages = [
  { id: 1, from: "them", text: "Halo, saya lihat iklan produknya. Masih tersedia?" },
  { id: 2, from: "me", text: "Halo kak! Masih tersedia kok. Mau dibantu info apa ya?" },
  { id: 3, from: "them", text: "Untuk harga paketnya berapa ya?" },
  { id: 4, from: "me", text: "Untuk paket basic 150rb/bulan, pro 350rb/bulan ya kak. Bisa mulai kapan aja." },
  { id: 5, from: "them", text: "Oke saya cek dulu ya, makasih infonya" },
];

export default function InboxPage() {
  const [activeId, setActiveId] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");

  const filtered = chats.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.wa.includes(search)
  );
  const active = chats.find((c) => c.id === activeId) ?? chats[0];

  const back = () => setActiveId(null);

  return (
    <div>
      {/* ⚠️ Mobile: chat view full-screen (ganti list). Desktop: 2 kolom. */}
      <PageHeader
        title={activeId ? active.name : "Inbox"}
        subtitle={activeId ? active.wa : "Semua percakapan WhatsApp dalam satu tempat (statis)"}
        actions={
          activeId ? (
            <button onClick={back} className="flex h-8 w-8 items-center justify-center rounded-lg border border-edge text-slate-300 transition hover:bg-white/5 md:hidden">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
          ) : (
            <Badge variant="success">● Terhubung ke WA</Badge>
          )
        }
      />

      {/* ⚠️ Mobile-first: list & chat stack. Desktop: 3 kolom (list 1/3 + chat 2/3). */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Chat list — mobile: sembunyi saat chat dibuka */}
        <div className={cn("md:col-span-1", activeId && "hidden md:block")}>
          <Card className="flex flex-col overflow-hidden">
            <div className="border-b border-edge/60 p-3">
              <Input placeholder="Cari chat..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="max-h-[calc(100vh-260px)] flex-1 overflow-y-auto md:max-h-none">
              {filtered.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  className={cn(
                    "flex w-full items-start gap-3 border-b border-edge/30 px-4 py-3 text-left transition-colors",
                    c.id === activeId ? "bg-accent/5" : "hover:bg-white/[0.02]"
                  )}
                >
                  <div className="relative">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-sm font-bold text-slate-300">
                      {c.name[0]}
                    </div>
                    {c.online && <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-base bg-success" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-bold text-slate-100">{c.name}</p>
                      <span className="shrink-0 text-[10px] text-faint">{c.time}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-xs text-muted">{c.last}</p>
                      {c.unread > 0 && (
                        <span className="flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-[#0B0E14]">
                          {c.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Conversation — mobile: tampil penuh saat aktif */}
        <div className={cn("md:col-span-2", !activeId && "hidden md:block")}>
          <Card className="flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-edge/60 px-4 py-3 md:px-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-2 text-sm font-bold">
                {active.name[0]}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-100">{active.name}</p>
                <p className="text-[10px] text-faint">{active.wa}</p>
              </div>
              <Badge variant={active.status === "Balas" ? "success" : active.status === "Unsub" ? "danger" : "info"}>
                {active.status}
              </Badge>
            </div>

            {/* Messages */}
            <div className="flex-1 space-y-3 overflow-y-auto bg-surface-2/30 p-4 md:h-[calc(100vh-280px)] md:p-5">
              {messages.map((m) => (
                <div key={m.id} className={cn("flex", m.from === "me" ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm md:max-w-[75%] md:px-4 md:py-2.5",
                      m.from === "me"
                        ? "rounded-br-md bg-accent text-[#0B0E14]"
                        : "rounded-bl-md bg-surface text-slate-200"
                    )}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Composer */}
            <div className="flex items-center gap-2 border-t border-edge/60 p-3">
              <Input
                placeholder="Ketik pesan..."
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="flex-1"
              />
              <button
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-[#0B0E14] transition hover:bg-accent-hover disabled:opacity-40"
                disabled={!draft.trim()}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}