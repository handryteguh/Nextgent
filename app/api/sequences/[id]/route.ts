import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sequences, sequenceSteps } from "@/db/schema";
import { isAuthed } from "@/lib/auth";
import { eq, asc } from "drizzle-orm";

// GET /api/sequences/[id] — detail 1 sequence + steps
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const seq = db.select().from(sequences).where(eq(sequences.id, Number(id))).get();
  if (!seq) return NextResponse.json({ error: "Sequence tidak ditemukan" }, { status: 404 });

  const steps = db
    .select()
    .from(sequenceSteps)
    .where(eq(sequenceSteps.sequenceId, seq.id))
    .orderBy(asc(sequenceSteps.order))
    .all();

  return NextResponse.json({ data: { ...seq, steps } });
}

// PUT /api/sequences/[id] — update sequence (name, trigger, stopOnReply, enabled)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const seq = db.select().from(sequences).where(eq(sequences.id, Number(id))).get();
  if (!seq) return NextResponse.json({ error: "Sequence tidak ditemukan" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const updates: Partial<typeof seq> & { updatedAt: number } = { updatedAt: Date.now() };

  if (body?.name?.trim()) updates.name = body.name.trim();
  if (["new_contact", "deal_stage", "manual"].includes(body?.trigger)) updates.trigger = body.trigger;
  if (typeof body?.stopOnReply === "boolean") updates.stopOnReply = body.stopOnReply;
  if (typeof body?.enabled === "boolean") updates.enabled = body.enabled;

  const [updated] = await db
    .update(sequences)
    .set(updates)
    .where(eq(sequences.id, Number(id)))
    .returning();

  return NextResponse.json({ data: updated });
}

// DELETE /api/sequences/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const seq = db.select().from(sequences).where(eq(sequences.id, Number(id))).get();
  if (!seq) return NextResponse.json({ error: "Sequence tidak ditemukan" }, { status: 404 });

  await db.delete(sequences).where(eq(sequences.id, Number(id)));
  return NextResponse.json({ ok: true });
}
