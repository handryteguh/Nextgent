import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { followupJobs, contacts, sequences, sequenceSteps } from "@/db/schema";
import { isAuthed } from "@/lib/auth";
import { eq, desc, sql } from "drizzle-orm";

// GET /api/followup-jobs?status=active&contactId=1
export async function GET(req: NextRequest) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const statusFilter = searchParams.get("status");
  const contactIdFilter = searchParams.get("contactId");

  // Join dengan contacts + sequences biar data lengkap
  const rows = db
    .select({
      id: followupJobs.id,
      status: followupJobs.status,
      currentStep: followupJobs.currentStep,
      nextSendAt: followupJobs.nextSendAt,
      lastSentAt: followupJobs.lastSentAt,
      stoppedReason: followupJobs.stoppedReason,
      retryCount: followupJobs.retryCount,
      createdAt: followupJobs.createdAt,
      updatedAt: followupJobs.updatedAt,
      contactId: followupJobs.contactId,
      sequenceId: followupJobs.sequenceId,
      contactName: contacts.name,
      contactPhone: contacts.phone,
      sequenceName: sequences.name,
    })
    .from(followupJobs)
    .leftJoin(contacts, eq(followupJobs.contactId, contacts.id))
    .leftJoin(sequences, eq(followupJobs.sequenceId, sequences.id))
    .orderBy(desc(followupJobs.updatedAt))
    .all();

  // Filter in-memory (drizzle sqlite $dynamic + join butuh workaround)
  let result = rows;
  if (statusFilter) result = result.filter((r) => r.status === statusFilter);
  if (contactIdFilter) result = result.filter((r) => r.contactId === Number(contactIdFilter));

  // Hitung summary KPI
  const total = rows.length;
  const active = rows.filter((r) => r.status === "active").length;
  const paused = rows.filter((r) => r.status === "paused").length;
  const completed = rows.filter((r) => r.status === "completed").length;
  const stopped = rows.filter((r) => r.status === "stopped").length;

  return NextResponse.json({ data: result, summary: { total, active, paused, completed, stopped } });
}

// POST /api/followup-jobs — mulai sequence untuk kontak
export async function POST(req: NextRequest) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const contactId = Number(body?.contactId);
  const sequenceId = Number(body?.sequenceId);

  if (!contactId) return NextResponse.json({ error: "contactId wajib diisi" }, { status: 400 });
  if (!sequenceId) return NextResponse.json({ error: "sequenceId wajib diisi" }, { status: 400 });

  // Validasi kontak + sequence ada
  const contact = db.select().from(contacts).where(eq(contacts.id, contactId)).get();
  if (!contact) return NextResponse.json({ error: "Kontak tidak ditemukan" }, { status: 404 });

  const seq = db.select().from(sequences).where(eq(sequences.id, sequenceId)).get();
  if (!seq) return NextResponse.json({ error: "Sequence tidak ditemukan" }, { status: 404 });

  // Cek sudah ada job aktif untuk kontak + sequence ini
  const existing = db
    .select()
    .from(followupJobs)
    .where(eq(followupJobs.contactId, contactId))
    .all()
    .find((j) => j.sequenceId === sequenceId && j.status === "active");
  if (existing) return NextResponse.json({ error: "Kontak sudah ada job aktif di sequence ini" }, { status: 409 });

  // Ambil step pertama untuk nextSendAt
  const firstStep = db
    .select()
    .from(sequenceSteps)
    .where(eq(sequenceSteps.sequenceId, sequenceId))
    .orderBy(sql`"order" ASC`)
    .limit(1)
    .get();

  const now = Date.now();
  const nextSendAt = firstStep ? now + firstStep.delayHours * 60 * 60 * 1000 : null;

  const [job] = await db
    .insert(followupJobs)
    .values({
      contactId,
      sequenceId,
      currentStep: 0,
      status: "active",
      nextSendAt,
      retryCount: 0,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return NextResponse.json({ data: job }, { status: 201 });
}
