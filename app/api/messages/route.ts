import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { messages, contacts } from "@/db/schema";
import { isAuthed } from "@/lib/auth";
import { eq, sql } from "drizzle-orm";

// GET /api/messages — list konversasi unik (1 row per phone, pesan terakhir)
export async function GET() {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Ambil pesan terakhir per phone + unread count
  const rows = db.all(sql`
    SELECT
      m.phone,
      m.text        AS last_text,
      m.direction   AS last_direction,
      m.created_at  AS last_at,
      c.name        AS contact_name,
      c.id          AS contact_id,
      SUM(CASE WHEN m.direction = 'in' AND m.status != 'read' THEN 1 ELSE 0 END) AS unread
    FROM messages m
    LEFT JOIN contacts c ON c.phone = m.phone
    WHERE m.id IN (
      SELECT MAX(id) FROM messages GROUP BY phone
    )
    GROUP BY m.phone
    ORDER BY m.created_at DESC
  `) as {
    phone: string;
    last_text: string;
    last_direction: string;
    last_at: number;
    contact_name: string | null;
    contact_id: number | null;
    unread: number;
  }[];

  return NextResponse.json({ data: rows });
}

// POST /api/messages — kirim pesan keluar via WA bridge, simpan ke DB
export async function POST(req: NextRequest) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const phone = body?.phone?.replace(/[^0-9]/g, "");
  const text = body?.text?.trim();
  if (!phone || !text) return NextResponse.json({ error: "phone dan text wajib diisi" }, { status: 400 });

  // Cari contactId kalau ada
  const contact = db.select({ id: contacts.id }).from(contacts).where(eq(contacts.phone, phone)).get();

  const now = Date.now();
  const [msg] = await db.insert(messages).values({
    phone,
    direction: "out",
    text,
    status: "sent",
    contactId: contact?.id ?? null,
    createdAt: now,
  }).returning();

  // Kirim via WA bridge (fire-and-forget, error tidak blok response DB)
  const vpsUrl = process.env.HERMES_VPS_URL ?? "";
  const vpsToken = process.env.HERMES_VPS_TOKEN ?? "";
  let sent = false;
  let waId: string | null = null;

  if (vpsUrl && vpsToken) {
    try {
      const res = await fetch(`${vpsUrl}/send`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${vpsToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone, message: text }),
        signal: AbortSignal.timeout(10_000),
      });
      const data = await res.json().catch(() => ({})) as { status?: string; messageId?: string };
      if (data.status === "ok") {
        sent = true;
        waId = data.messageId ?? null;
        await db.update(messages)
          .set({ status: "delivered", waId })
          .where(eq(messages.id, msg.id));
      }
    } catch { /* bridge error — pesan tetap tersimpan di DB */ }
  }

  return NextResponse.json({ data: { ...msg, sent, waId } }, { status: 201 });
}
