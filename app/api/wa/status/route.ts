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
    // VPS bridge endpoint: GET /status
    // Response: { api: { status, uptime, port, ... }, bridge: { status, queueLength, uptime, ... } }
    const res = await fetch(`${HERMES_VPS_URL}/status`, {
      method: "GET",
      headers: { "Authorization": `Bearer ${HERMES_VPS_TOKEN}` },
      signal: AbortSignal.timeout(5_000),
    });

    const data = await res.json().catch(() => ({})) as {
      api?: { status?: string; uptime?: number; port?: number; memMb?: number };
      bridge?: { status?: string; queueLength?: number; uptime?: number };
    };

    const bridgeConnected = data.bridge?.status === "connected";
    return NextResponse.json({
      connected: bridgeConnected,
      api: data.api ?? null,
      bridge: data.bridge ?? null,
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
