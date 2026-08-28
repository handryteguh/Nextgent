import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { followupJobs } from "@/db/schema";
import { isAuthed } from "@/lib/auth";
import { eq } from "drizzle-orm";

// GET /api/followup-jobs/[id]
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const job = db.select().from(followupJobs).where(eq(followupJobs.id, Number(id))).get();
  if (!job) return NextResponse.json({ error: "Job tidak ditemukan" }, { status: 404 });

  return NextResponse.json({ data: job });
}

// DELETE /api/followup-jobs/[id] — hapus job
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const job = db.select().from(followupJobs).where(eq(followupJobs.id, Number(id))).get();
  if (!job) return NextResponse.json({ error: "Job tidak ditemukan" }, { status: 404 });

  await db.delete(followupJobs).where(eq(followupJobs.id, Number(id)));
  return NextResponse.json({ ok: true });
}
