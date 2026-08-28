import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { messages, contacts } from "@/db/schema";
import { isAuthed } from "@/lib/auth";
import { eq } from "drizzle-orm";

// Hermes WA bridge di VPS — http://43.157.212.210:3002
const HERMES_VPS_URL = process.env.HERMES_VPS_URL ?? ""; // e.g. http://43.157.212.210:3002
const HERMES_VPS_TOKEN = process.env.HERMES_VPS_TOKEN ?? "";

// POST /api/wa/send — kirim pesan WA via Hermes VPS bridge
// Body: { phone, message }
export async function POST(req: NextRequest) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const phone = body?.phone?.replace(/[^0-9]/g, "");
  const message = body?.message?.trim();

  if (!phone || !message) {
    return NextResponse.json({ error: "phone dan message wajib" }, { status: 400 });
  }

  // Cari contactId kalau ada
  const contact = db.select({ id: contacts.id }).from(contacts).where(eq(contacts.phone, phone)).get();
  const now = Date.now();

  // Simpan ke DB dulu
  const [msg] = await db.insert(messages).values({
    phone,
    direction: "out",
    text: message,
    status: "sent",
    contactId: contact?.id ?? null,
    createdAt: now,
  }).returning();

  // Kirim via Hermes VPS bridge kalau URL tersedia
  if (!HERMES_VPS_URL || !HERMES_VPS_TOKEN) {
    return NextResponse.json({
      ok: true,
      saved: true,
      sent: false,
      note: "HERMES_VPS_URL / HERMES_VPS_TOKEN belum diset — pesan tersimpan di DB, belum dikirim ke WA",
      data: msg,
    });
  }

  try {
    // VPS bridge endpoint: POST /send  { phone, message }
    // Response: { status: "ok", messageId: "..." }
    const res = await fetch(`${HERMES_VPS_URL}/send`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${HERMES_VPS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phone, message }),
      signal: AbortSignal.timeout(10_000),
    });

    const data = await res.json().catch(() => ({})) as { status?: string; messageId?: string; error?: string };

    if (data.status === "ok") {
      await db.update(messages)
        .set({ status: "delivered", waId: data.messageId ?? null })
        .where(eq(messages.id, msg.id));
      return NextResponse.json({ ok: true, saved: true, sent: true, waId: data.messageId, data: msg });
    } else {
      return NextResponse.json({
        ok: false, saved: true, sent: false,
        error: data.error ?? "Hermes VPS bridge error",
        data: msg,
      }, { status: 502 });
    }
  } catch (e) {
    const err = e as Error;
    return NextResponse.json({
      ok: false, saved: true, sent: false,
      error: err.message,
      data: msg,
    }, { status: 502 });
  }
}
