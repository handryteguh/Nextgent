import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { messages, contacts, settings } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET /api/wa/status — cek status koneksi WA (via Fonnte device status)
export async function GET() {
  const FONNTE_TOKEN = process.env.FONNTE_TOKEN ?? "";

  if (!FONNTE_TOKEN) {
    return NextResponse.json({
      connected: false,
      reason: "FONNTE_TOKEN belum diset di environment",
      provider: "fonnte",
    });
  }

  try {
    const res = await fetch("https://api.fonnte.com/device", {
      method: "GET",
      headers: { "Authorization": FONNTE_TOKEN },
      signal: AbortSignal.timeout(5000),
    });

    const data = await res.json().catch(() => ({})) as { status?: boolean; device?: { status?: string; name?: string } };

    if (data.status && data.device?.status === "connect") {
      return NextResponse.json({
        connected: true,
        device: data.device?.name ?? "Unknown",
        provider: "fonnte",
      });
    }

    return NextResponse.json({
      connected: false,
      reason: data.device?.status ?? "Device tidak terhubung",
      provider: "fonnte",
    });
  } catch {
    return NextResponse.json({
      connected: false,
      reason: "Gagal cek status Fonnte",
      provider: "fonnte",
    });
  }
}

// POST /api/wa/status — terima webhook status dari Fonnte (opsional)
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ ok: true });

  // Update message status kalau ada delivery report
  if (body.id && body.status) {
    await db
      .update(messages)
      .set({ status: body.status === "read" ? "read" : body.status === "delivered" ? "delivered" : "sent" })
      .where(eq(messages.waId, String(body.id)));
  }

  return NextResponse.json({ ok: true });
}

// Supaya tidak unused
void (contacts);
void (settings);
