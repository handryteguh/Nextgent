"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────
type Convo = {
  phone: string;
  last_text: string;
  last_direction: string;
  last_at: number;
  contact_name: string | null;
  contact_id: number | null;
  unread: number;
};

type Message = {
  id: number;
  phone: string;
  direction: "in" | "out";
  text: string;
  status: string | null;
  createdAt: number;
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtTime(ms: number): string {
  const d = new Date(ms);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - ms) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Kemarin";
  if (diffDays < 7) return d.toLocaleDateString("id-ID", { weekday: "short" });
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

function initials(name: string | null, phone: string): string {
  if (name) return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return phone.slice(-2);
}

const avatarColors = [
  "bg-accent/20 text-accent",
  "bg-violet/20 text-violet",
  "bg-info/20 text-info",
  "bg-success/20 text-success",
  "bg-orange/20 text-orange",
];

function avatarColor(phone: string): string {
  const idx = phone.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % avatarColors.length;
  return avatarColors[idx];
}

// ── WA Status Banner (dinamis) ────────────────────────────────────────────────
function WaStatusBanner({ connected }: { connected: boolean | null }) {
  if (connected === null) return null; // loading, jangan tampil
  if (connected) {
    return (
      <div className="mb-4 flex items-center gap-3 rounded-xl border border-success/30 bg-success/10 px-4 py-3">
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-success opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
        </span>
        <p className="text-sm font-semibold text-success">Bridge WA terhubung — pesan keluar aktif</p>
      </div>
    );
  }
  return (
    <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="relative inline-flex h-2 w-2 rounded-full bg-warning" />
        </span>
        <p className="text-sm font-semibold text-warning">
          Bridge WA belum terhubung — pesan baru belum masuk otomatis
        </p>
      </div>
      <Badge variant="warning">Offline</Badge>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function InboxPage() {
  const [convos, setConvos] = useState<Convo[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activePhone, setActivePhone] = useState<string | null>(null);
  const [activeContact, setActiveContact] = useState<{ name: string; phone: string } | null>(null);
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [waConnected, setWaConnected] = useState<boolean | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // ── Fetch WA status ───────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const checkWa = async () => {
      try {
        const res = await fetch("/api/wa/status", { cache: "no-store" });
        if (res.ok && !cancelled) {
          const data = await res.json();
          setWaConnected(data.connected ?? false);
        }
      } catch { if (!cancelled) setWaConnected(false); }
    };
    checkWa();
    const interval = setInterval(checkWa, 30_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  // ── Fetch convos ──────────────────────────────────────────────────────────
  const fetchConvos = useCallback(async () => {
    try {
      const res = await fetch("/api/messages", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setConvos(data.data ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConvos();
    const interval = setInterval(fetchConvos, 10_000);
    return () => clearInterval(interval);
  }, [fetchConvos]);

  // ── Fetch messages per phone ───────────────────────────────────────────────
  const fetchMessages = useCallback(async (phone: string) => {
    const res = await fetch(`/api/messages/${encodeURIComponent(phone)}`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setMessages(data.data ?? []);
      if (data.contact) setActiveContact({ name: data.contact.name, phone: data.contact.phone });
      else setActiveContact(null);
      await fetchConvos(); // refresh unread badges
    }
  }, [fetchConvos]);

  // ── Poll pesan masuk dari VPS bridge (tiap 3 detik — real-time) ─────────────
  useEffect(() => {
    let cancelled = false;
    let lastTs = 0;
    const poll = async () => {
      try {
        const res = await fetch(`/api/wa/poll?since=${lastTs}&limit=50`, { cache: "no-store" });
        if (res.ok && !cancelled) {
          const data = await res.json() as { ok: boolean; saved: number; lastTs: number };
          if (data.ok && data.saved > 0) {
            lastTs = data.lastTs;
            await fetchConvos();
            setActivePhone((prev) => {
              if (prev) void fetchMessages(prev);
              return prev;
            });
          } else if (data.ok && data.lastTs > lastTs) {
            lastTs = data.lastTs;
          }
        }
      } catch { /* silent fail */ }
    };
    poll();
    const interval = setInterval(poll, 3_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [fetchConvos, fetchMessages]);

  useEffect(() => {
    if (!activePhone) return;
    // wrap in async IIFE agar lint gak complaint setState-in-effect
    const load = async () => { await fetchMessages(activePhone); };
    void load();
    const interval = setInterval(() => { void fetchMessages(activePhone); }, 5_000);
    return () => clearInterval(interval);
  }, [activePhone, fetchMessages]);

  // ── Scroll to bottom on new messages ─────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Send message ──────────────────────────────────────────────────────────
  async function handleSend() {
    if (!draft.trim() || !activePhone || sending) return;
    setSending(true);
    try {
      await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: activePhone, text: draft.trim() }),
      });
      setDraft("");
      await fetchMessages(activePhone);
    } finally {
      setSending(false);
    }
  }

  // ── Filter ─────────────────────────────────────────────────────────────────
  const filtered = convos.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.phone.includes(q) ||
      (c.contact_name ?? "").toLowerCase().includes(q)
    );
  });

  const activeConvo = convos.find((c) => c.phone === activePhone);
  void activeConvo; // dipakai future (FU status badge di header)

  return (
    <div>
      <PageHeader
        title={activePhone ? (activeContact?.name ?? activePhone) : "Inbox"}
        subtitle={activePhone ? activePhone : "Semua percakapan WhatsApp"}
        actions={
          activePhone ? (
            <button
              onClick={() => { setActivePhone(null); setMessages([]); }}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-muted hover:text-slate-100"
            >
              ← Kembali
            </button>
          ) : undefined
        }
      />

      <WaStatusBanner connected={waConnected} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* ── Chat list ────────────────────────────────────────────────────── */}
        <Card className={cn("lg:col-span-1", activePhone && "hidden lg:block")}>
          <div className="border-b border-edge/60 p-3">
            <Input
              placeholder="Cari nama atau nomor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="divide-y divide-edge/30 overflow-y-auto" style={{ maxHeight: "calc(100vh - 280px)" }}>
            {loading && (
              <p className="py-8 text-center text-sm text-muted">Memuat...</p>
            )}
            {!loading && filtered.length === 0 && (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-muted">Belum ada pesan</p>
                <p className="mt-1 text-xs text-faint">Pesan masuk setelah bridge WA terhubung</p>
              </div>
            )}
            {filtered.map((convo) => (
              <button
                key={convo.phone}
                onClick={() => setActivePhone(convo.phone)}
                className={cn(
                  "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5",
                  activePhone === convo.phone && "bg-accent/10"
                )}
              >
                {/* Avatar */}
                <div className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                  avatarColor(convo.phone)
                )}>
                  {initials(convo.contact_name, convo.phone)}
                </div>
                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-slate-100">
                      {convo.contact_name ?? convo.phone}
                    </p>
                    <span className="shrink-0 text-[10px] text-faint">{fmtTime(convo.last_at)}</span>
                  </div>
                  <div className="mt-0.5 flex items-center justify-between gap-2">
                    <p className="truncate text-xs text-muted">
                      {convo.last_direction === "out" && <span className="text-faint">Kamu: </span>}
                      {convo.last_text}
                    </p>
                    {convo.unread > 0 && (
                      <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent px-1 text-[9px] font-extrabold text-[#0B0E14]">
                        {convo.unread > 99 ? "99+" : convo.unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* ── Chat view ─────────────────────────────────────────────────────── */}
        <Card className={cn("flex flex-col lg:col-span-2", !activePhone && "hidden lg:flex")}>
          {!activePhone ? (
            <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
                <svg className="h-7 w-7 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8m-8 4h5m-9 6h16a2 2 0 002-2V6a2 2 0 00-2-2H4a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-slate-300">Pilih percakapan</p>
              <p className="mt-1 text-xs text-faint">Klik kontak di sebelah kiri untuk membuka chat</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center gap-3 border-b border-edge/60 px-4 py-3">
                <div className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold",
                  avatarColor(activePhone)
                )}>
                  {initials(activeContact?.name ?? null, activePhone)}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-100">{activeContact?.name ?? activePhone}</p>
                  <p className="text-xs text-faint">{activePhone}</p>
                </div>
                {activeContact && (
                  <a
                    href={`/contacts`}
                    className="ml-auto text-xs font-semibold text-accent hover:underline"
                  >
                    Lihat Kontak →
                  </a>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-3 p-4" style={{ maxHeight: "calc(100vh - 360px)" }}>
                {messages.length === 0 && (
                  <p className="py-8 text-center text-sm text-muted">Belum ada pesan</p>
                )}
                {messages.map((msg) => (
                  <div key={msg.id} className={cn("flex", msg.direction === "out" ? "justify-end" : "justify-start")}>
                    <div className={cn(
                      "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm",
                      msg.direction === "out"
                        ? "rounded-br-sm bg-accent text-[#0B0E14]"
                        : "rounded-bl-sm bg-surface-2 text-slate-200"
                    )}>
                      <p>{msg.text}</p>
                      <p className={cn(
                        "mt-0.5 text-right text-[10px]",
                        msg.direction === "out" ? "text-[#0B0E14]/60" : "text-faint"
                      )}>
                        {fmtTime(msg.createdAt)}
                        {msg.direction === "out" && (
                          <span className="ml-1">{msg.status === "read" ? "✓✓" : msg.status === "delivered" ? "✓✓" : "✓"}</span>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="flex items-center gap-2 border-t border-edge/60 p-3">
                <Input
                  placeholder="Ketik pesan... (Bridge WA offline — tersimpan di DB)"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  className="flex-1"
                />
                <button
                  onClick={handleSend}
                  disabled={!draft.trim() || sending}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-[#0B0E14] transition hover:bg-accent-hover disabled:opacity-40"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
