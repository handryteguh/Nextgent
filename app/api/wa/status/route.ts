import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { messages } from "@/db/schema";
import { eq } from "drizzle-orm";

const HERMES_VPS_URL = process.env.HERMES_VPS_URL ?? "";
const HERMES_VPS_TOKEN = process.env.HERMES_VPS_TOKEN ?? "";

// GET /api/wa/status — cek status koneksi WA dari Hermes VPS bridge
export async function GET() {
  if (!HERMES_VPS_URL || !HERMES_VPS_TOKEN) {
    return NextResponse.json({
      connected: false,
      reason: "HERMES_VPS_URL / HERMES_VPS_TOKEN belum diset",
      provider: "hermes-vps",
    });
  }

  try {
    const res = await fetch(`${HERMES_VPS_URL}/api/wa/status`, {
      method: "GET",
      headers: { "Authorization": `Bearer ${HERMES_VPS_TOKEN}` },
      signal: AbortSignal.timeout(5_000),
    });

    const data = await res.json().catch(() => ({})) as { connected?: boolean; reason?: string };

    return NextResponse.json({
      connected: data.connected ?? false,
      reason: data.reason,
      provider: "hermes-vps",
    });
  } catch {
    return NextResponse.json({
      connected: false,
      reason: "Gagal reach Hermes VPS",
      provider: "hermes-vps",
    });
  }
}

// POST /api/wa/status — delivery report webhook dari Hermes VPS
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ ok: true });

  // Update status pesan berdasarkan waId
  if (body.waId && body.status) {
    const status = body.status === "read" ? "read"
      : body.status === "delivered" ? "delivered"
      : "sent";
    await db.update(messages).set({ status }).where(eq(messages.waId, String(body.waId)));
  }

  return NextResponse.json({ ok: true });
}
