import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { messages, contacts } from "@/db/schema";
import { isAuthed } from "@/lib/auth";
import { eq } from "drizzle-orm";

const FONNTE_TOKEN = process.env.FONNTE_TOKEN ?? "";
const FONNTE_API = "https://api.fonnte.com/send";

// POST /api/wa/send — kirim pesan WA via Fonnte
// Body: { phone, message }
export async function POST(req: NextRequest) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const phone = body?.phone?.replace(/[^0-9]/g, "");
  const message = body?.message?.trim();

  if (!phone || !message) {
    return NextResponse.json({ error: "phone dan message wajib" }, { status: 400 });
  }

  // Simpan ke DB dulu (status sent, belum delivered)
  const contact = db.select({ id: contacts.id }).from(contacts).where(eq(contacts.phone, phone)).get();
  const now = Date.now();

  const [msg] = await db.insert(messages).values({
    phone,
    direction: "out",
    text: message,
    status: "sent",
    contactId: contact?.id ?? null,
    createdAt: now,
  }).returning();

  // Kirim via Fonnte kalau token tersedia
  if (!FONNTE_TOKEN) {
    return NextResponse.json({
      ok: true,
      saved: true,
      sent: false,
      note: "FONNTE_TOKEN belum diset — pesan tersimpan di DB tapi belum dikirim ke WA",
      data: msg,
    });
  }

  try {
    const res = await fetch(FONNTE_API, {
      method: "POST",
      headers: {
        "Authorization": FONNTE_TOKEN,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        target: phone,
        message,
        delay: "3", // 3 detik delay (ban safety)
        countryCode: "62",
      }),
    });

    const data = await res.json().catch(() => ({})) as { status?: boolean; reason?: string; id?: string };

    if (data.status) {
      // Update status delivered
      await db.update(messages).set({ status: "delivered", waId: String(data.id ?? "") }).where(eq(messages.id, msg.id));
      return NextResponse.json({ ok: true, saved: true, sent: true, waId: data.id, data: msg });
    } else {
      // Fonnte error — pesan tetap tersimpan di DB
      return NextResponse.json({
        ok: false,
        saved: true,
        sent: false,
        error: data.reason ?? "Fonnte error",
        data: msg,
      }, { status: 502 });
    }
  } catch (e) {
    const err = e as Error;
    return NextResponse.json({
      ok: false,
      saved: true,
      sent: false,
      error: err.message,
      data: msg,
    }, { status: 502 });
  }
}
