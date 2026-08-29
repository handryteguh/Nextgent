"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FilterPills, type Pill } from "@/components/ui/filter-pills";
import { DataTable, type Column } from "@/components/ui/data-table";
import { KpiCard } from "@/components/ui/kpi-card";
import { fmtDate } from "@/lib/utils";

// ============================================================
// Types
// ============================================================
type ContactStatus = "lead" | "customer" | "unsubscribed";

interface Contact {
  id: number;
  name: string;
  phone: string;
  status: ContactStatus;
  note: string | null;
  source: string | null;
  createdAt: number;
  updatedAt: number;
}

// ============================================================
// Helpers
// ============================================================
const statusVariant: Record<ContactStatus, "default" | "success" | "danger" | "warning"> = {
  lead: "warning",
  customer: "success",
  unsubscribed: "danger",
};

const statusLabel: Record<ContactStatus, string> = {
  lead: "Lead",
  customer: "Customer",
  unsubscribed: "Unsubscribe",
};

const pills: Pill[] = [
  { key: "semua", label: "Semua" },
  { key: "lead", label: "Lead" },
  { key: "customer", label: "Customer" },
  { key: "unsubscribed", label: "Unsubscribe" },
];

// ============================================================
// Modal Tambah Kontak
// ============================================================
function AddContactModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: (c: Contact) => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<ContactStatus>("lead");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, note, status }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Gagal menyimpan"); return; }
      onSaved(data.data);
    } catch {
      setError("Gagal terhubung ke server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md rounded-2xl border border-edge bg-surface p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-bold">Tambah Kontak</h2>
          <button onClick={onClose} className="text-muted hover:text-slate-200">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-muted">Nama *</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama lengkap" required />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-muted">Nomor WA * (format 62xxx)</label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="6281234567890" inputMode="numeric" required />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-muted">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ContactStatus)}
              className="w-full rounded-lg border border-edge bg-surface-2 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="lead">Lead</option>
              <option value="customer">Customer</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-muted">Catatan</label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Topik, kebutuhan, dsb." />
          </div>
          {error && <p className="text-xs text-danger">{error}</p>}
          <div className="flex gap-2 pt-1">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Menyimpan…" : "Simpan Kontak"}
            </Button>
            <Button type="button" variant="ghost" onClick={onClose} className="flex-1">Batal</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// Modal Kirim WA
// ============================================================
function SendWaModal({
  contact,
  onClose,
}: {
  contact: { name: string; phone: string };
  onClose: () => void;
}) {
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setStatus("sending");
    setErrMsg(null);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: contact.phone, text: message.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setErrMsg(data.error || "Gagal kirim"); setStatus("error"); return; }
      setStatus(data.data?.sent ? "ok" : "error");
      if (!data.data?.sent) setErrMsg("Pesan tersimpan tapi belum terkirim ke WA");
    } catch {
      setStatus("error");
      setErrMsg("Gagal terhubung ke server");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md rounded-2xl border border-edge bg-surface p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold">Kirim WA</h2>
            <p className="text-xs text-muted">{contact.name} · {contact.phone}</p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-slate-200">✕</button>
        </div>

        {status === "ok" ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl border border-success/30 bg-success/10 px-4 py-3">
              <span className="text-success">✓</span>
              <p className="text-sm font-semibold text-success">Pesan terkirim ke WhatsApp!</p>
            </div>
            <Button onClick={onClose} className="w-full">Tutup</Button>
          </div>
        ) : (
          <form onSubmit={handleSend} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-muted">Pesan *</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tulis pesan WhatsApp di sini..."
                rows={4}
                required
                className="w-full resize-none rounded-lg border border-edge bg-surface-2 px-3 py-2 text-sm text-slate-200 placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            {errMsg && <p className="text-xs text-danger">{errMsg}</p>}
            <div className="flex gap-2 pt-1">
              <Button type="submit" disabled={status === "sending" || !message.trim()} className="flex-1">
                {status === "sending" ? "Mengirim…" : "Kirim WA"}
              </Button>
              <Button type="button" variant="ghost" onClick={onClose} className="flex-1">Batal</Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Halaman Contacts
// ============================================================
export default function ContactsPage() {
  const [data, setData] = useState<Contact[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("semua");
  const [query, setQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [sendWaContact, setSendWaContact] = useState<{ name: string; phone: string } | null>(null);

  // Re-fetch setiap kali query/filter berubah
  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ limit: "100" });
        if (query) params.set("q", query);
        if (filter !== "semua") params.set("status", filter);
        const res = await fetch(`/api/contacts?${params}`);
        const json = await res.json();
        if (!active) return;
        setData(json.data ?? []);
        setTotal(json.total ?? 0);
      } catch { /* silent */ }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [query, filter]);

  const handleDelete = async (id: number) => {
    setDeleteId(id);
    try {
      await fetch(`/api/contacts/${id}`, { method: "DELETE" });
      setData((d) => d.filter((c) => c.id !== id));
    } finally { setDeleteId(null); }
  };

  const cols: Column<Contact>[] = [
    {
      key: "name",
      header: "Nama",
      render: (r) => (
        <div>
          <p className="font-semibold text-slate-100">{r.name}</p>
          <p className="text-xs text-muted">{r.phone}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <Badge variant={statusVariant[r.status]}>{statusLabel[r.status]}</Badge>
      ),
    },
    {
      key: "note",
      header: "Catatan",
      render: (r) => <span className="text-sm text-muted">{r.note ?? "—"}</span>,
    },
    {
      key: "source",
      header: "Sumber",
      render: (r) => <span className="text-xs text-faint">{r.source ?? "manual"}</span>,
    },
    {
      key: "createdAt",
      header: "Bergabung",
      render: (r) => <span className="text-xs text-faint">{fmtDate(new Date(r.createdAt).toISOString())}</span>,
    },
    {
      key: "id",
      header: "",
      render: (r) => (
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSendWaContact({ name: r.name, phone: r.phone })}
            className="text-xs text-accent/80 hover:text-accent"
          >
            Kirim WA
          </button>
          <button
            onClick={() => handleDelete(r.id)}
            disabled={deleteId === r.id}
            className="text-xs text-danger/70 hover:text-danger disabled:opacity-40"
          >
            {deleteId === r.id ? "…" : "Hapus"}
          </button>
        </div>
      ),
    },
  ];

  const leads = data.filter((c) => c.status === "lead").length;
  const customers = data.filter((c) => c.status === "customer").length;

  return (
    <div className="space-y-6">
      {showAdd && (
        <AddContactModal
          onClose={() => setShowAdd(false)}
          onSaved={(c) => { setData((d) => [c, ...d]); setShowAdd(false); }}
        />
      )}
      {sendWaContact && (
        <SendWaModal
          contact={sendWaContact}
          onClose={() => setSendWaContact(null)}
        />
      )}

      <PageHeader
        title="Kontak"
        subtitle={`${total} kontak terdaftar`}
        actions={
          <Button onClick={() => setShowAdd(true)} size="sm">
            + Tambah Kontak
          </Button>
        }
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard value={total} label="Total" sub="Semua kontak" color="info"
          icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>}
        />
        <KpiCard value={leads} label="Lead" sub="Belum closing" color="orange"
          icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>}
        />
        <KpiCard value={customers} label="Customer" sub="Sudah closing" color="success"
          icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
        />
        <KpiCard value={data.filter((c) => c.status === "unsubscribed").length} label="Unsub" sub="Stop follow-up" color="danger"
          icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>}
        />
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-edge/60 px-5 py-4">
          <FilterPills pills={pills} active={filter} onChange={setFilter} />
          <div className="w-full sm:w-64">
            <Input
              placeholder="Cari nama atau nomor WA..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
        {loading ? (
          <div className="py-12 text-center text-sm text-muted">Memuat kontak…</div>
        ) : (
          <DataTable columns={cols} rows={data} emptyText="Kontak tidak ditemukan" />
        )}
      </Card>
    </div>
  );
}
