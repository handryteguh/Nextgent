import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { contacts } from "@/db/schema";
import { isAuthed } from "@/lib/auth";
import { eq } from "drizzle-orm";

// PATCH /api/contacts/[id] — update status/note
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const contactId = Number(id);
  if (isNaN(contactId)) return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });

  const body = await req.json().catch(() => null);
  const updates: Record<string, unknown> = { updatedAt: Date.now() };
  if (body?.name) updates.name = body.name.trim();
  if (body?.note !== undefined) updates.note = body.note?.trim() ?? null;
  if (["lead", "customer", "unsubscribed"].includes(body?.status)) updates.status = body.status;

  const [row] = await db.update(contacts).set(updates).where(eq(contacts.id, contactId)).returning();
  if (!row) return NextResponse.json({ error: "Kontak tidak ditemukan" }, { status: 404 });

  return NextResponse.json({ data: row });
}

// DELETE /api/contacts/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const contactId = Number(id);
  if (isNaN(contactId)) return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });

  const [row] = await db.delete(contacts).where(eq(contacts.id, contactId)).returning();
  if (!row) return NextResponse.json({ error: "Kontak tidak ditemukan" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
