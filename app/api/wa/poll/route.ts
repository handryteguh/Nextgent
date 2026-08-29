import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { messages, contacts } from "@/db/schema";
import { isAuthed } from "@/lib/auth";
import { eq } from "drizzle-orm";

const HERMES_VPS_URL = process.env.HERMES_VPS_URL ?? "";
const HERMES_VPS_TOKEN = process.env.HERMES_VPS_TOKEN ?? "";

// GET /api/wa/poll?since=<timestamp_ms>
// Pull pesan masuk dari VPS bridge, simpan ke DB, return count
export async function GET(req: NextRequest) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!HERMES_VPS_URL || !HERMES_VPS_TOKEN) {
    return NextResponse.json({ ok: false, reason: "HERMES_VPS_URL/TOKEN belum diset" }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const since = parseInt(searchParams.get("since") ?? "0", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 200);

  // Pull dari VPS bridge
  let bridgeMessages: {
    id: string;
    phone: string;
    text: string;
    direction: string;
    timestamp: number;
    name?: string | null;
  }[] = [];

  try {
    const res = await fetch(
      `${HERMES_VPS_URL}/messages?since=${since}&limit=${limit}`,
      {
        method: "GET",
        headers: { "Authorization": `Bearer ${HERMES_VPS_TOKEN}` },
        signal: AbortSignal.timeout(8_000),
      }
    );
    const data = await res.json().catch(() => ({})) as {
      count?: number;
      messages?: typeof bridgeMessages;
    };
    bridgeMessages = data.messages ?? [];
  } catch (e) {
    const err = e as Error;
    return NextResponse.json({ ok: false, reason: err.message, saved: 0 }, { status: 502 });
  }

  if (bridgeMessages.length === 0) {
    return NextResponse.json({ ok: true, pulled: 0, saved: 0, lastTs: since });
  }

  // Simpan ke DB — dedup by waId
  let saved = 0;
  let lastTs = since;

  for (const m of bridgeMessages) {
    const phone = m.phone?.replace(/[^0-9]/g, "");
    const text = m.text?.trim();
    if (!phone || !text) continue;

    // Skip nomor yang bukan format WA valid (harus 628xxx, minimal 10 digit)
    if (!phone.startsWith("62") || phone.length < 10) continue;

    // Dedup
    if (m.id) {
      const existing = db.select({ id: messages.id })
        .from(messages).where(eq(messages.waId, m.id)).get();
      if (existing) {
        if (m.timestamp > lastTs) lastTs = m.timestamp;
        continue;
      }
    }

    // Auto-create contact kalau belum ada
    let contact = db.select({ id: contacts.id })
      .from(contacts).where(eq(contacts.phone, phone)).get();
    if (!contact) {
      const name = m.name?.trim() || `+${phone}`;
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

    // Simpan pesan
    await db.insert(messages).values({
      phone,
      direction: (m.direction === "out") ? "out" : "in",
      text,
      status: "delivered",
      waId: m.id ?? null,
      contactId: contact?.id ?? null,
      createdAt: m.timestamp || Date.now(),
    });

    saved++;
    if (m.timestamp > lastTs) lastTs = m.timestamp;
  }

  return NextResponse.json({
    ok: true,
    pulled: bridgeMessages.length,
    saved,
    lastTs,
  });
}
