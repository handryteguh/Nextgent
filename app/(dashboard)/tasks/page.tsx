"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FilterPills } from "@/components/ui/filter-pills";
import { DataTable, type Column } from "@/components/ui/data-table";

// ── Types ─────────────────────────────────────────────────────────────────────

type Task = {
  id: number;
  title: string;
  description: string | null;
  type: "call" | "whatsapp" | "email" | "internal";
  priority: "low" | "medium" | "high";
  status: "pending" | "in_progress" | "done" | "cancelled";
  dueAt: number;
  contactId: number | null;
  dealId: number | null;
  completedAt: number | null;
  createdAt: number;
  contactName: string | null;
  isOverdue: boolean;
};

type Summary = { total: number; overdue: number; pending: number; inProgress: number; done: number };

// ── Helpers ───────────────────────────────────────────────────────────────────

function priorityBadge(p: Task["priority"]): "danger" | "warning" | "info" {
  return p === "high" ? "danger" : p === "medium" ? "warning" : "info";
}

function priorityLabel(p: Task["priority"]) {
  return p === "high" ? "Tinggi" : p === "medium" ? "Sedang" : "Rendah";
}

function formatDue(ms: number): string {
  const d = new Date(ms);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today.getTime() + 86_400_000);
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (target.getTime() === today.getTime()) return "Hari ini";
  if (target.getTime() === tomorrow.getTime()) return "Besok";
  if (target < today) return `${Math.round((today.getTime() - target.getTime()) / 86_400_000)} hari lalu`;
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
}

const EMPTY_FORM = {
  title: "",
  description: "",
  type: "internal" as Task["type"],
  priority: "medium" as Task["priority"],
  dueAt: "",
  contactId: "",
};

// ── Main Component ─────────────────────────────────────────────────────────────

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [summary, setSummary] = useState<Summary>({ total: 0, overdue: 0, pending: 0, inProgress: 0, done: 0 });
  const [filter, setFilter] = useState("semua");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks", { cache: "no-store" });
      if (!res.ok) throw new Error("Gagal ambil data tasks");
      const data = await res.json();
      setTasks(data.data ?? []);
      setSummary(data.summary ?? { total: 0, overdue: 0, pending: 0, inProgress: 0, done: 0 });
      setNow(Date.now()); // update snapshot waktu setelah fetch
    } catch (e) {
      const err = e as Error;
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => { if (!cancelled) await fetchTasks(); };
    tick();
    const interval = setInterval(tick, 30_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [fetchTasks]);

  async function handleComplete(id: number) {
    setActionLoading(id);
    try {
      await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "done" }),
      });
      await fetchTasks();
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCreate() {
    setFormError(null);
    if (!form.title.trim()) { setFormError("Judul wajib diisi"); return; }
    if (!form.dueAt) { setFormError("Jatuh tempo wajib diisi"); return; }

    const dueAt = new Date(form.dueAt).getTime();
    if (isNaN(dueAt)) { setFormError("Format tanggal tidak valid"); return; }

    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title.trim(),
        description: form.description.trim() || null,
        type: form.type,
        priority: form.priority,
        dueAt,
        contactId: form.contactId ? Number(form.contactId) : null,
      }),
    });
    const data = await res.json();
    if (!res.ok) { setFormError(data.error ?? "Gagal membuat task"); return; }
    setShowForm(false);
    setForm(EMPTY_FORM);
    await fetchTasks();
  }

  // ── Filter + search ────────────────────────────────────────────────────────
  const enriched = tasks.map((t) => ({
    ...t,
    isOverdue: (t.status === "pending" || t.status === "in_progress") && t.dueAt < now,
  }));

  const filtered = enriched.filter((t) => {
    const q = query.toLowerCase();
    const matchQ = !q || t.title.toLowerCase().includes(q) || (t.contactName ?? "").toLowerCase().includes(q);
    if (!matchQ) return false;
    if (filter === "semua") return true;
    if (filter === "overdue") return t.isOverdue;
    if (filter === "open") return (t.status === "pending" || t.status === "in_progress") && !t.isOverdue;
    if (filter === "done") return t.status === "done";
    return true;
  });

  const pills = [
    { key: "semua", label: "Semua", count: summary.total },
    { key: "open", label: "Terbuka", count: summary.pending + summary.inProgress },
    { key: "overdue", label: "Terlambat", count: summary.overdue },
    { key: "done", label: "Selesai", count: summary.done },
  ];

  // ── Columns ────────────────────────────────────────────────────────────────
  const cols: Column<(typeof filtered)[number]>[] = [
    {
      key: "title",
      header: "Tugas",
      render: (t) => (
        <div>
          <p className="font-semibold text-slate-100">{t.title}</p>
          {t.description && <p className="text-xs text-muted">{t.description}</p>}
        </div>
      ),
    },
    {
      key: "contactName",
      header: "Kontak",
      render: (t) => <span className="text-sm text-muted">{t.contactName ?? "—"}</span>,
    },
    {
      key: "dueAt",
      header: "Jatuh Tempo",
      render: (t) => (
        <span className={t.isOverdue ? "font-bold text-danger" : "text-slate-300"}>
          {formatDue(t.dueAt)}
        </span>
      ),
    },
    {
      key: "priority",
      header: "Prioritas",
      render: (t) => <Badge variant={priorityBadge(t.priority)}>{priorityLabel(t.priority)}</Badge>,
    },
    {
      key: "type",
      header: "Tipe",
      render: (t) => <span className="text-xs text-muted capitalize">{t.type}</span>,
    },
    {
      key: "id",
      header: "Aksi",
      render: (t) => {
        const busy = actionLoading === t.id;
        return (
          <div className="flex justify-end gap-2">
            {t.status !== "done" && t.status !== "cancelled" && (
              <Button
                variant="success"
                size="sm"
                disabled={busy}
                onClick={() => handleComplete(t.id)}
              >
                Selesai
              </Button>
            )}
            {(t.status === "done" || t.status === "cancelled") && (
              <span className="text-xs text-muted italic">Selesai</span>
            )}
          </div>
        );
      },
    },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div>
      <PageHeader
        title="Tasks"
        subtitle="Reminder & tugas follow-up manual"
        actions={
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            + Tambah Task
          </Button>
        }
      />

      {/* New Task Form */}
      {showForm && (
        <Card className="mb-6">
          <CardHeader title="Task Baru" />
          <CardBody>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="t-title" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted">Judul *</label>
                <Input
                  id="t-title"
                  placeholder="Contoh: Follow-up Budi soal proposal"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                />
              </div>
              <div>
                <label htmlFor="t-type" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted">Tipe</label>
                <Select
                  id="t-type"
                  value={form.type}
                  onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as Task["type"] }))}
                >
                  <option value="internal">Internal</option>
                  <option value="call">Telepon</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="email">Email</option>
                </Select>
              </div>
              <div>
                <label htmlFor="t-priority" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted">Prioritas</label>
                <Select
                  id="t-priority"
                  value={form.priority}
                  onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value as Task["priority"] }))}
                >
                  <option value="high">Tinggi</option>
                  <option value="medium">Sedang</option>
                  <option value="low">Rendah</option>
                </Select>
              </div>
              <div>
                <label htmlFor="t-due" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted">Jatuh Tempo *</label>
                <Input
                  id="t-due"
                  type="datetime-local"
                  value={form.dueAt}
                  onChange={(e) => setForm((p) => ({ ...p, dueAt: e.target.value }))}
                />
              </div>
              <div>
                <label htmlFor="t-contact" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted">Contact ID (opsional)</label>
                <Input
                  id="t-contact"
                  placeholder="ID kontak terkait"
                  value={form.contactId}
                  onChange={(e) => setForm((p) => ({ ...p, contactId: e.target.value }))}
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="t-desc" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted">Deskripsi (opsional)</label>
                <Input
                  id="t-desc"
                  placeholder="Detail tambahan..."
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                />
              </div>
            </div>
            {formError && <p className="mt-2 text-sm text-danger">{formError}</p>}
            <div className="mt-4 flex gap-2">
              <Button size="sm" onClick={handleCreate}>Simpan</Button>
              <Button variant="outline" size="sm" onClick={() => { setShowForm(false); setFormError(null); }}>Batal</Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Table */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-edge/60 px-5 py-4">
          <FilterPills pills={pills} active={filter} onChange={setFilter} />
          <div className="w-full sm:w-64">
            <Input
              placeholder="Cari tugas..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
        {loading ? (
          <div className="px-5 py-8 text-center text-sm text-muted">Memuat data...</div>
        ) : error ? (
          <div className="px-5 py-8 text-center text-sm text-danger">{error}</div>
        ) : (
          <DataTable columns={cols} rows={filtered} emptyText="Tidak ada tugas" />
        )}
      </Card>
    </div>
  );
}
