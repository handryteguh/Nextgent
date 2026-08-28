import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { messages, contacts } from "@/db/schema";
import { isAuthed } from "@/lib/auth";
import { eq, asc } from "drizzle-orm";

// GET /api/messages/[phone] — history chat dengan satu nomor
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ phone: string }> }
) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { phone } = await params;
  const rows = db
    .select()
    .from(messages)
    .where(eq(messages.phone, phone))
    .orderBy(asc(messages.createdAt))
    .all();

  // Mark semua pesan masuk sebagai read
  await db
    .update(messages)
    .set({ status: "read" })
    .where(eq(messages.phone, phone));

  // Info kontak
  const contact = db.select().from(contacts).where(eq(contacts.phone, phone)).get();

  return NextResponse.json({ data: rows, contact: contact ?? null });
}
