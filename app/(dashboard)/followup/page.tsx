"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/ui/data-table";
import { KpiCard } from "@/components/ui/kpi-card";

// ── Types ────────────────────────────────────────────────────────────────────

type FUJob = {
  id: number;
  status: "active" | "paused" | "stopped" | "completed" | "failed";
  currentStep: number;
  nextSendAt: number | null;
  lastSentAt: number | null;
  stoppedReason: string | null;
  retryCount: number;
  contactId: number;
  sequenceId: number;
  contactName: string | null;
  contactPhone: string | null;
  sequenceName: string | null;
};

type Summary = { total: number; active: number; paused: number; completed: number; stopped: number };

type Sequence = {
  id: number;
  name: string;
  enabled: boolean;
  trigger: string;
  stopOnReply: boolean;
  steps: { id: number; name: string; delayHours: number; template: string; order: number }[];
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusBadgeVariant(s: FUJob["status"]): "info" | "warning" | "success" | "danger" | "violet" {
  const map: Record<FUJob["status"], "info" | "warning" | "success" | "danger" | "violet"> = {
    active: "info",
    paused: "warning",
    stopped: "danger",
    completed: "success",
    failed: "danger",
  };
  return map[s];
}

function statusLabel(job: FUJob): string {
  if (job.status === "completed") return "Selesai";
  if (job.status === "stopped") {
    const reasonMap: Record<string, string> = {
      replied: "Balas — STOP",
      manual: "Stop manual",
      unsubscribed: "Unsubscribe",
      max_retry: "Gagal — retry habis",
    };
    return reasonMap[job.stoppedReason ?? ""] ?? "Dihentikan";
  }
  if (job.status === "paused") return "Paused (WA putus)";
  if (job.status === "failed") return "Gagal — retry habis";
  if (job.status === "active") return `Menunggu step ${job.currentStep + 1}`;
  return job.status;
}

function formatTs(ms: number | null): string {
  if (!ms) return "—";
  return new Date(ms).toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function FollowupPage() {
  const [jobs, setJobs] = useState<FUJob[]>([]);
  const [summary, setSummary] = useState<Summary>({ total: 0, active: 0, paused: 0, completed: 0, stopped: 0 });
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit sequence state
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name: "", delay: "24", template: "" });

  // New job form
  const [showNewJob, setShowNewJob] = useState(false);
  const [newJob, setNewJob] = useState({ contactId: "", sequenceId: "" });
  const [newJobError, setNewJobError] = useState<string | null>(null);

  // Action loading state
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [jobsRes, seqRes] = await Promise.all([
        fetch("/api/followup-jobs", { cache: "no-store" }),
        fetch("/api/sequences", { cache: "no-store" }),
      ]);
      if (!jobsRes.ok || !seqRes.ok) throw new Error("Gagal ambil data");
      const jobsData = await jobsRes.json();
      const seqData = await seqRes.json();
      setJobs(jobsData.data ?? []);
      setSummary(jobsData.summary ?? { total: 0, active: 0, paused: 0, completed: 0, stopped: 0 });
      setSequences(seqData.data ?? []);
    } catch (e) {
      const err = e as Error;
      setError(err.message ?? "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      if (!cancelled) await fetchData();
    };
    tick();
    const interval = setInterval(tick, 30_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [fetchData]);

  async function handleAction(jobId: number, action: string, extra?: Record<string, unknown>) {
    setActionLoading(jobId);
    try {
      const res = await fetch(`/api/followup-jobs/${jobId}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      if (!res.ok) {
        const d = await res.json();
        alert(d.error ?? "Gagal eksekusi action");
        return;
      }
      await fetchData();
    } catch {
      alert("Gagal koneksi ke server");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCreateJob() {
    setNewJobError(null);
    const res = await fetch("/api/followup-jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactId: Number(newJob.contactId), sequenceId: Number(newJob.sequenceId) }),
    });
    const data = await res.json();
    if (!res.ok) { setNewJobError(data.error ?? "Gagal membuat job"); return; }
    setShowNewJob(false);
    setNewJob({ contactId: "", sequenceId: "" });
    await fetchData();
  }

  // ── Columns ────────────────────────────────────────────────────────────────
  const cols: Column<FUJob>[] = [
    {
      key: "contactName",
      header: "Kontak",
      render: (r) => (
        <div>
          <p className="font-semibold text-slate-100">{r.contactName ?? `#${r.contactId}`}</p>
          <p className="text-xs text-muted">{r.contactPhone ?? "—"}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => <Badge variant={statusBadgeVariant(r.status)}>{statusLabel(r)}</Badge>,
    },
    {
      key: "sequenceName",
      header: "Sequence",
      render: (r) => <span className="text-slate-300 text-sm">{r.sequenceName ?? `#${r.sequenceId}`}</span>,
    },
    {
      key: "nextSendAt",
      header: "Jadwal Kirim",
      render: (r) => <span className="text-sm text-slate-300">{formatTs(r.nextSendAt)}</span>,
    },
    {
      key: "id",
      header: "Aksi",
      render: (r) => {
        const busy = actionLoading === r.id;
        return (
          <div className="flex items-center gap-1.5">
            {r.status === "active" && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={busy}
                  onClick={() => handleAction(r.id, "skip")}
                >
                  Lewati
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={busy}
                  onClick={() => handleAction(r.id, "snooze", { snoozeHours: 24 })}
                >
                  Tunda
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  disabled={busy}
                  onClick={() => handleAction(r.id, "stop")}
                >
                  Stop
                </Button>
              </>
            )}
            {r.status === "paused" && (
              <Button
                variant="success"
                size="sm"
                disabled={busy}
                onClick={() => handleAction(r.id, "resume")}
              >
                Lanjutkan
              </Button>
            )}
            {(r.status === "completed" || r.status === "stopped") && (
              <span className="text-xs text-muted italic">—</span>
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
        title="Follow-up"
        subtitle="Sales cadence engine — FU1 → FU2 → FU3 otomatis"
        actions={
          <Button size="sm" onClick={() => setShowNewJob(!showNewJob)}>
            + Mulai FU
          </Button>
        }
      />

      {/* KPI Row */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard label="Total Aktif" value={String(summary.active)} icon="🔄" color="info" />
        <KpiCard label="Paused" value={String(summary.paused)} icon="⏸" color="orange" />
        <KpiCard label="Selesai" value={String(summary.completed)} icon="✅" color="success" />
        <KpiCard label="Dihentikan" value={String(summary.stopped)} icon="🛑" color="danger" />
      </div>

      {/* New Job Form */}
      {showNewJob && (
        <Card className="mb-6">
          <CardHeader title="Mulai Follow-up Baru" subtitle="Pilih kontak dan sequence" />
          <CardBody>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="nj-contact" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted">Contact ID</label>
                <Input
                  id="nj-contact"
                  placeholder="Masukkan ID kontak"
                  value={newJob.contactId}
                  onChange={(e) => setNewJob((p) => ({ ...p, contactId: e.target.value }))}
                />
              </div>
              <div>
                <label htmlFor="nj-seq" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted">Sequence</label>
                <Select
                  id="nj-seq"
                  value={newJob.sequenceId}
                  onChange={(e) => setNewJob((p) => ({ ...p, sequenceId: e.target.value }))}
                >
                  <option value="">Pilih sequence</option>
                  {sequences.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </Select>
              </div>
            </div>
            {newJobError && <p className="mt-2 text-sm text-danger">{newJobError}</p>}
            <div className="mt-4 flex gap-2">
              <Button size="sm" onClick={handleCreateJob}>Mulai</Button>
              <Button variant="outline" size="sm" onClick={() => setShowNewJob(false)}>Batal</Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Sequence Config */}
      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Sequence Steps" subtitle="Template pesan tiap step FU" />
          <CardBody>
            {sequences.length === 0 ? (
              <p className="text-sm text-muted">Belum ada sequence. Buat lewat API dulu.</p>
            ) : (
              sequences.flatMap((seq) =>
                seq.steps.map((step) => (
                  <div key={step.id} className="mb-3 rounded-lg border border-edge/60 p-3">
                    {editId === step.id ? (
                      <div className="space-y-2">
                        <Input
                          placeholder="Nama step"
                          value={editForm.name}
                          onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                        />
                        <Input
                          type="number"
                          placeholder="Delay (jam)"
                          value={editForm.delay}
                          onChange={(e) => setEditForm((p) => ({ ...p, delay: e.target.value }))}
                        />
                        <textarea
                          className="w-full rounded border border-edge/60 bg-surface px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-accent"
                          rows={2}
                          placeholder="Template pesan..."
                          value={editForm.template}
                          onChange={(e) => setEditForm((p) => ({ ...p, template: e.target.value }))}
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => setEditId(null)}>Simpan</Button>
                          <Button variant="outline" size="sm" onClick={() => setEditId(null)}>Batal</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-100">
                            {step.name}
                            <span className="ml-2 text-xs font-normal text-muted">H+{step.delayHours / 24} ({step.delayHours} jam)</span>
                          </p>
                          <p className="mt-0.5 truncate text-xs text-muted">{step.template}</p>
                        </div>
                        <div className="flex shrink-0 gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditId(step.id);
                              setEditForm({ name: step.name, delay: String(step.delayHours), template: step.template });
                            }}
                          >
                            Edit
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )
            )}
            <div className="flex items-center justify-between rounded-lg border border-success/25 bg-success/5 p-3 text-xs">
              <span className="flex items-center gap-2 font-semibold text-success">
                <span className="h-2 w-2 rounded-full bg-success" /> Safety Engine Aktif
              </span>
              <span className="text-muted">08:00–20:00 · delay ±20% · max 1/hari · unsubscribe-aware</span>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Progress table */}
      <Card>
        <CardHeader title="Progress Follow-up" subtitle={`${summary.total} kontak dalam sequence`} />
        {loading ? (
          <div className="px-5 py-8 text-center text-sm text-muted">Memuat data...</div>
        ) : error ? (
          <div className="px-5 py-8 text-center text-sm text-danger">{error}</div>
        ) : (
          <DataTable columns={cols} rows={jobs} emptyText="Belum ada kontak dalam sequence" />
        )}
      </Card>
    </div>
  );
}
