import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { tasks, contacts } from "@/db/schema";
import { isAuthed } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";

// GET /api/tasks?status=pending&priority=high&q=
export async function GET(req: NextRequest) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const statusFilter = searchParams.get("status"); // pending|in_progress|done|cancelled|overdue
  const priorityFilter = searchParams.get("priority");
  const q = searchParams.get("q")?.trim() ?? "";
  const now = Date.now();

  // Join dengan contacts buat tampil nama kontak
  const rows = db
    .select({
      id: tasks.id,
      title: tasks.title,
      description: tasks.description,
      type: tasks.type,
      priority: tasks.priority,
      status: tasks.status,
      dueAt: tasks.dueAt,
      contactId: tasks.contactId,
      dealId: tasks.dealId,
      completedAt: tasks.completedAt,
      createdAt: tasks.createdAt,
      contactName: contacts.name,
      contactPhone: contacts.phone,
    })
    .from(tasks)
    .leftJoin(contacts, eq(tasks.contactId, contacts.id))
    .orderBy(desc(tasks.dueAt))
    .all();

  // Tentukan status "overdue" secara virtual (pending/in_progress + dueAt < now)
  type Row = typeof rows[number] & { isOverdue: boolean };
  const enriched: Row[] = rows.map((r) => ({
    ...r,
    isOverdue: (r.status === "pending" || r.status === "in_progress") && r.dueAt < now,
  }));

  let result = enriched;

  if (statusFilter === "overdue") {
    result = result.filter((r) => r.isOverdue);
  } else if (statusFilter) {
    result = result.filter((r) => r.status === statusFilter && !r.isOverdue);
  }

  if (priorityFilter) result = result.filter((r) => r.priority === priorityFilter);
  if (q) {
    result = result.filter(
      (r) =>
        r.title.toLowerCase().includes(q.toLowerCase()) ||
        (r.contactName ?? "").toLowerCase().includes(q.toLowerCase())
    );
  }

  // Summary buat badge sidebar
  const overdue = enriched.filter((r) => r.isOverdue).length;
  const pending = enriched.filter((r) => r.status === "pending" && !r.isOverdue).length;
  const inProgress = enriched.filter((r) => r.status === "in_progress" && !r.isOverdue).length;
  const done = enriched.filter((r) => r.status === "done").length;

  return NextResponse.json({
    data: result,
    summary: { total: enriched.length, overdue, pending, inProgress, done },
  });
}

// POST /api/tasks — buat task baru
export async function POST(req: NextRequest) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const title = body?.title?.trim();
  const dueAt = Number(body?.dueAt);

  if (!title) return NextResponse.json({ error: "Judul task wajib diisi" }, { status: 400 });
  if (!dueAt || isNaN(dueAt)) return NextResponse.json({ error: "dueAt (ms epoch) wajib diisi" }, { status: 400 });

  const priority = ["low", "medium", "high"].includes(body?.priority) ? body.priority : "medium";
  const type = ["call", "whatsapp", "email", "internal"].includes(body?.type) ? body.type : "internal";
  const description = body?.description?.trim() ?? null;
  const contactId = body?.contactId ? Number(body.contactId) : null;
  const dealId = body?.dealId ? Number(body.dealId) : null;

  const now = Date.now();
  const [task] = await db
    .insert(tasks)
    .values({ title, description, type, priority, status: "pending", dueAt, contactId, dealId, createdAt: now })
    .returning();

  return NextResponse.json({ data: task }, { status: 201 });
}
