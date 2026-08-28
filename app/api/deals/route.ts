import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { deals, contacts } from "@/db/schema";
import { isAuthed } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";

// GET /api/deals — list semua deals + nama kontak
export async function GET() {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = db
    .select({
      id: deals.id,
      title: deals.title,
      value: deals.value,
      status: deals.status,
      stage: deals.stage,
      contactId: deals.contactId,
      expectedClose: deals.expectedClose,
      wonAt: deals.wonAt,
      lostReason: deals.lostReason,
      notes: deals.notes,
      createdAt: deals.createdAt,
      updatedAt: deals.updatedAt,
      contactName: contacts.name,
    })
    .from(deals)
    .leftJoin(contacts, eq(deals.contactId, contacts.id))
    .orderBy(desc(deals.createdAt))
    .all();

  return NextResponse.json({ data: rows });
}

// POST /api/deals — buat deal baru
export async function POST(req: NextRequest) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const title = body?.title?.trim();
  if (!title) return NextResponse.json({ error: "Judul deal wajib diisi" }, { status: 400 });

  const value = Number(body?.value) || 0;
  const contactId = body?.contactId ? Number(body.contactId) : null;
  const expectedClose = body?.expectedClose?.trim() || null;
  const notes = body?.notes?.trim() || null;

  const now = Date.now();
  const [deal] = await db
    .insert(deals)
    .values({
      title,
      value,
      status: "open",
      stage: "New",
      contactId,
      expectedClose,
      notes,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return NextResponse.json({ data: deal }, { status: 201 });
}
