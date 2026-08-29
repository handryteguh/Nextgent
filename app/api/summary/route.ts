import { NextResponse } from "next/server";
import { db } from "@/db";
import { contacts, tasks, followupJobs, deals } from "@/db/schema";
import { isAuthed } from "@/lib/auth";
import { eq, sql } from "drizzle-orm";
import { sequences } from "@/db/schema";

// GET /api/summary — satu hit buat semua badge + KPI data
// Dipake sidebar (badge) + dashboard (KPI) + bottom-nav
export async function GET() {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = Date.now();

  // ── Contacts ──────────────────────────────────────────────
  const totalContacts = db
    .select({ count: sql<number>`count(*)` })
    .from(contacts)
    .get()?.count ?? 0;

  const totalLeads = db
    .select({ count: sql<number>`count(*)` })
    .from(contacts)
    .where(eq(contacts.status, "lead"))
    .get()?.count ?? 0;

  const totalCustomers = db
    .select({ count: sql<number>`count(*)` })
    .from(contacts)
    .where(eq(contacts.status, "customer"))
    .get()?.count ?? 0;

  // ── Tasks ─────────────────────────────────────────────────
  const allTasks = db.select({ status: tasks.status, dueAt: tasks.dueAt }).from(tasks).all();
  const tasksOverdue = allTasks.filter(
    (t) => (t.status === "pending" || t.status === "in_progress") && t.dueAt < now
  ).length;
  const tasksPending = allTasks.filter(
    (t) => t.status === "pending" && t.dueAt >= now
  ).length;

  // ── Follow-up Jobs ────────────────────────────────────────
  const allJobs = db.select({ status: followupJobs.status }).from(followupJobs).all();
  const fuActive = allJobs.filter((j) => j.status === "active").length;
  const fuPaused = allJobs.filter((j) => j.status === "paused").length;
  const fuCompleted = allJobs.filter((j) => j.status === "completed").length;

  // ── Deals ─────────────────────────────────────────────────
  const allDeals = db
    .select({ status: deals.status, value: deals.value, stage: deals.stage })
    .from(deals)
    .all();
  const openDeals = allDeals.filter((d) => d.status === "open");
  const dealsActive = openDeals.length;
  const dealsPipelineValue = openDeals.reduce((sum, d) => sum + (d.value ?? 0), 0);
  const dealsWon = allDeals.filter((d) => d.status === "won").length;

  // ── Sequences ─────────────────────────────────────────────
  const allSequences = db.select({ id: sequences.id, enabled: sequences.enabled }).from(sequences).all();
  const seqActive = allSequences.filter((s) => s.enabled).length;
  const seqTotal = allSequences.length;

  return NextResponse.json({
    data: {
      contacts: { total: totalContacts, leads: totalLeads, customers: totalCustomers },
      tasks: { overdue: tasksOverdue, pending: tasksPending, total: allTasks.length },
      followup: { active: fuActive, paused: fuPaused, completed: fuCompleted },
      deals: { active: dealsActive, pipelineValue: dealsPipelineValue, won: dealsWon },
      sequences: { total: seqTotal, active: seqActive },
      wa: await getWaStatus(),
    },
  });
}

async function getWaStatus(): Promise<{
  connected: boolean;
  uptime?: number;
  queueLength?: number;
  memMb?: number;
}> {
  const url = process.env.HERMES_VPS_URL ?? "";
  const token = process.env.HERMES_VPS_TOKEN ?? "";
  if (!url || !token) return { connected: false };
  try {
    // VPS bridge endpoint: GET /status
    const res = await fetch(`${url}/status`, {
      method: "GET",
      headers: { "Authorization": `Bearer ${token}` },
      signal: AbortSignal.timeout(4000),
    });
    const data = await res.json().catch(() => ({})) as {
      api?: { status?: string; uptime?: number; memMb?: number };
      bridge?: { status?: string; queueLength?: number; uptime?: number };
    };
    const connected = data.bridge?.status === "connected";
    return {
      connected,
      uptime: data.bridge?.uptime,
      queueLength: data.bridge?.queueLength ?? 0,
      memMb: data.api?.memMb,
    };
  } catch {
    return { connected: false };
  }
}
