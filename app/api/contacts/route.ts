import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { contacts } from "@/db/schema";
import { isAuthed } from "@/lib/auth";
import { like, or, eq, desc, sql } from "drizzle-orm";

// GET /api/contacts?q=&status=&page=1&limit=50
export async function GET(req: NextRequest) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q")?.trim() ?? "";
  const status = searchParams.get("status") ?? "semua";
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 50)));
  const offset = (page - 1) * limit;

  // Build query
  let query = db.select().from(contacts).$dynamic();

  // Search
  if (q) {
    query = query.where(
      or(
        like(contacts.name, `%${q}%`),
        like(contacts.phone, `%${q}%`),
        like(contacts.note, `%${q}%`)
      )
    );
  }

  // Filter by status
  if (status === "lead") query = query.where(eq(contacts.status, "lead"));
  else if (status === "customer") query = query.where(eq(contacts.status, "customer"));
  else if (status === "unsubscribed") query = query.where(eq(contacts.status, "unsubscribed"));

  const total = db
    .select({ count: sql<number>`count(*)` })
    .from(contacts)
    .get()?.count ?? 0;

  const rows = await query.orderBy(desc(contacts.createdAt)).limit(limit).offset(offset);

  return NextResponse.json({ data: rows, total, page, limit });
}

// POST /api/contacts — tambah kontak baru
export async function POST(req: NextRequest) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const name = body?.name?.trim();
  const phone = body?.phone?.trim().replace(/\D/g, ""); // strip non-digit
  const note = body?.note?.trim() ?? null;
  const source = body?.source?.trim() ?? "manual";
  const status = ["lead", "customer", "unsubscribed"].includes(body?.status)
    ? body.status
    : "lead";

  if (!name) return NextResponse.json({ error: "Nama wajib diisi" }, { status: 400 });
  if (!phone || !/^62\d{8,13}$/.test(phone))
    return NextResponse.json({ error: "Nomor WA harus format 62xxx (8-13 digit setelah 62)" }, { status: 400 });

  // Cek duplikat
  const existing = db.select().from(contacts).where(eq(contacts.phone, phone)).get();
  if (existing) return NextResponse.json({ error: "Nomor WA sudah terdaftar" }, { status: 409 });

  const now = Date.now();
  const [row] = await db
    .insert(contacts)
    .values({ name, phone, note, source, status, createdAt: now, updatedAt: now })
    .returning();

  return NextResponse.json({ data: row }, { status: 201 });
}
