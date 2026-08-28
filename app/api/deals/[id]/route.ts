import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { deals } from "@/db/schema";
import { isAuthed } from "@/lib/auth";
import { eq } from "drizzle-orm";

// GET /api/deals/[id]
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const deal = db.select().from(deals).where(eq(deals.id, Number(id))).get();
  if (!deal) return NextResponse.json({ error: "Deal tidak ditemukan" }, { status: 404 });

  return NextResponse.json({ data: deal });
}

// PUT /api/deals/[id] — update stage / status / fields
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const deal = db.select().from(deals).where(eq(deals.id, Number(id))).get();
  if (!deal) return NextResponse.json({ error: "Deal tidak ditemukan" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const now = Date.now();

  type DealUpdate = {
    title?: string;
    value?: number;
    stage?: "New" | "Contacted" | "Qualified" | "Proposal" | "Negotiation";
    status?: "open" | "won" | "lost";
    contactId?: number | null;
    expectedClose?: string | null;
    lostReason?: string | null;
    notes?: string | null;
    wonAt?: number | null;
    updatedAt: number;
  };

  const updates: DealUpdate = { updatedAt: now };

  if (body?.title?.trim()) updates.title = body.title.trim();
  if (body?.value !== undefined) updates.value = Number(body.value) || 0;
  if (["New", "Contacted", "Qualified", "Proposal", "Negotiation"].includes(body?.stage)) {
    updates.stage = body.stage;
  }
  if (["open", "won", "lost"].includes(body?.status)) {
    updates.status = body.status;
    if (body.status === "won") updates.wonAt = now;
    if (body.status === "open" || body.status === "lost") updates.wonAt = null;
  }
  if (body?.contactId !== undefined) updates.contactId = body.contactId ? Number(body.contactId) : null;
  if (body?.expectedClose !== undefined) updates.expectedClose = body.expectedClose || null;
  if (body?.lostReason !== undefined) updates.lostReason = body.lostReason || null;
  if (body?.notes !== undefined) updates.notes = body.notes || null;

  const [updated] = await db.update(deals).set(updates).where(eq(deals.id, Number(id))).returning();

  return NextResponse.json({ data: updated });
}

// DELETE /api/deals/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const deal = db.select().from(deals).where(eq(deals.id, Number(id))).get();
  if (!deal) return NextResponse.json({ error: "Deal tidak ditemukan" }, { status: 404 });

  await db.delete(deals).where(eq(deals.id, Number(id)));
  return NextResponse.json({ ok: true });
}
