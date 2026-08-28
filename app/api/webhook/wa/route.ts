import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { messages, contacts } from "@/db/schema";
import { eq } from "drizzle-orm";

// POST /api/webhook/wa — terima pesan masuk dari bridge Baileys/Fonnte
// Bridge mengirim POST dengan Authorization: Bearer <WEBHOOK_SECRET>
// Body: { phone, text, waId?, direction? }
// Endpoint ini TIDAK butuh PIN session — pakai WEBHOOK_SECRET env

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET ?? "changeme-secret";

export async function POST(req: NextRequest) {
  // Auth via Bearer token
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (token !== WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const phone = body?.phone?.replace(/[^0-9]/g, ""); // normalize
  const text = body?.text?.trim();
  const waId = body?.waId ?? body?.id ?? null;
  const direction = body?.direction === "out" ? "out" : "in";

  if (!phone || !text) {
    return NextResponse.json({ error: "phone dan text wajib" }, { status: 400 });
  }

  // Dedup by waId
  if (waId) {
    const existing = db.select({ id: messages.id }).from(messages)
      .where(eq(messages.waId, waId)).get();
    if (existing) return NextResponse.json({ ok: true, dedup: true });
  }

  // Auto-create contact kalau belum ada
  let contact = db.select({ id: contacts.id }).from(contacts).where(eq(contacts.phone, phone)).get();
  if (!contact && direction === "in") {
    const name = body?.name?.trim() || `+${phone}`;
    const now = Date.now();
    const [c] = await db.insert(contacts).values({
      name,
      phone,
      status: "lead",
      source: "chat",
      createdAt: now,
      updatedAt: now,
    }).returning({ id: contacts.id });
    contact = c;
  }

  const now = Date.now();
  const [msg] = await db.insert(messages).values({
    phone,
    direction,
    text,
    status: direction === "in" ? "delivered" : "sent",
    waId,
    contactId: contact?.id ?? null,
    createdAt: now,
  }).returning();

  return NextResponse.json({ ok: true, data: msg }, { status: 201 });
}
