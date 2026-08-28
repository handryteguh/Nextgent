import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sequences, sequenceSteps } from "@/db/schema";
import { isAuthed } from "@/lib/auth";
import { eq, asc } from "drizzle-orm";

// GET /api/sequences/[id]/steps
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const steps = db
    .select()
    .from(sequenceSteps)
    .where(eq(sequenceSteps.sequenceId, Number(id)))
    .orderBy(asc(sequenceSteps.order))
    .all();

  return NextResponse.json({ data: steps });
}

// POST /api/sequences/[id]/steps — tambah step ke sequence
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const seq = db.select().from(sequences).where(eq(sequences.id, Number(id))).get();
  if (!seq) return NextResponse.json({ error: "Sequence tidak ditemukan" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const name = body?.name?.trim();
  const delayHours = Number(body?.delayHours);
  const template = body?.template?.trim();
  const order = Number(body?.order ?? 1);

  if (!name) return NextResponse.json({ error: "Nama step wajib diisi" }, { status: 400 });
  if (!delayHours || delayHours < 1)
    return NextResponse.json({ error: "delayHours harus >= 1" }, { status: 400 });
  if (!template) return NextResponse.json({ error: "Template pesan wajib diisi" }, { status: 400 });

  const [step] = await db
    .insert(sequenceSteps)
    .values({ sequenceId: Number(id), name, delayHours, template, order, enabled: true })
    .returning();

  return NextResponse.json({ data: step }, { status: 201 });
}
