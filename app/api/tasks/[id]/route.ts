import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { tasks } from "@/db/schema";
import { isAuthed } from "@/lib/auth";
import { eq } from "drizzle-orm";

// GET /api/tasks/[id]
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const task = db.select().from(tasks).where(eq(tasks.id, Number(id))).get();
  if (!task) return NextResponse.json({ error: "Task tidak ditemukan" }, { status: 404 });

  return NextResponse.json({ data: task });
}

// PUT /api/tasks/[id] — update task
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const task = db.select().from(tasks).where(eq(tasks.id, Number(id))).get();
  if (!task) return NextResponse.json({ error: "Task tidak ditemukan" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const now = Date.now();

  type TaskUpdate = {
    title?: string;
    description?: string | null;
    type?: "call" | "whatsapp" | "email" | "internal";
    priority?: "low" | "medium" | "high";
    status?: "pending" | "in_progress" | "done" | "cancelled";
    dueAt?: number;
    contactId?: number | null;
    dealId?: number | null;
    completedAt?: number | null;
  };

  const updates: TaskUpdate = {};

  if (body?.title?.trim()) updates.title = body.title.trim();
  if (body?.description !== undefined) updates.description = body.description?.trim() ?? null;
  if (["call", "whatsapp", "email", "internal"].includes(body?.type)) updates.type = body.type;
  if (["low", "medium", "high"].includes(body?.priority)) updates.priority = body.priority;
  if (["pending", "in_progress", "done", "cancelled"].includes(body?.status)) {
    updates.status = body.status;
    if (body.status === "done") updates.completedAt = now;
    if (body.status !== "done") updates.completedAt = null;
  }
  if (body?.dueAt) updates.dueAt = Number(body.dueAt);
  if (body?.contactId !== undefined) updates.contactId = body.contactId ? Number(body.contactId) : null;
  if (body?.dealId !== undefined) updates.dealId = body.dealId ? Number(body.dealId) : null;

  const [updated] = await db.update(tasks).set(updates).where(eq(tasks.id, Number(id))).returning();

  return NextResponse.json({ data: updated });
}

// DELETE /api/tasks/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const task = db.select().from(tasks).where(eq(tasks.id, Number(id))).get();
  if (!task) return NextResponse.json({ error: "Task tidak ditemukan" }, { status: 404 });

  await db.delete(tasks).where(eq(tasks.id, Number(id)));
  return NextResponse.json({ ok: true });
}
