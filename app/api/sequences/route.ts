import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sequences, sequenceSteps } from "@/db/schema";
import { isAuthed } from "@/lib/auth";
import { eq, asc } from "drizzle-orm";

// GET /api/sequences — list semua sequence + steps-nya
export async function GET() {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = db.select().from(sequences).all();
  const result = rows.map((seq) => {
    const steps = db
      .select()
      .from(sequenceSteps)
      .where(eq(sequenceSteps.sequenceId, seq.id))
      .orderBy(asc(sequenceSteps.order))
      .all();
    return { ...seq, steps };
  });

  return NextResponse.json({ data: result });
}

// POST /api/sequences — buat sequence baru
export async function POST(req: NextRequest) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const name = body?.name?.trim();
  const trigger = ["new_contact", "deal_stage", "manual"].includes(body?.trigger)
    ? body.trigger
    : "new_contact";
  const stopOnReply = body?.stopOnReply !== false;

  if (!name) return NextResponse.json({ error: "Nama sequence wajib diisi" }, { status: 400 });

  const now = Date.now();
  const [seq] = await db
    .insert(sequences)
    .values({ name, trigger, stopOnReply, enabled: true, createdAt: now, updatedAt: now })
    .returning();

  return NextResponse.json({ data: seq }, { status: 201 });
}
