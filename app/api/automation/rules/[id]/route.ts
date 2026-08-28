import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { autoRules } from "@/db/schema";
import { isAuthed } from "@/lib/auth";
import { eq } from "drizzle-orm";

// PATCH /api/automation/rules/[id] — toggle enabled / update
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const updates: Partial<{ keyword: string; reply: string; enabled: boolean }> = {};
  if (body?.keyword !== undefined) updates.keyword = body.keyword.trim();
  if (body?.reply !== undefined) updates.reply = body.reply.trim();
  if (body?.enabled !== undefined) updates.enabled = Boolean(body.enabled);
  const [row] = await db.update(autoRules).set(updates).where(eq(autoRules.id, Number(id))).returning();
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: row });
}

// DELETE /api/automation/rules/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await db.delete(autoRules).where(eq(autoRules.id, Number(id)));
  return NextResponse.json({ ok: true });
}
