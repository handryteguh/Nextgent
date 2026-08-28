import { NextRequest, NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";

const HERMES_VPS_URL = process.env.HERMES_VPS_URL ?? "";
const HERMES_VPS_TOKEN = process.env.HERMES_VPS_TOKEN ?? "";

// GET /api/wa/logs?n=20 — pull logs dari Hermes VPS WA bridge
// Query: n = jumlah log (default 20, max 100)
export async function GET(req: NextRequest) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!HERMES_VPS_URL || !HERMES_VPS_TOKEN) {
    return NextResponse.json({
      ok: false,
      reason: "HERMES_VPS_URL / HERMES_VPS_TOKEN belum diset",
    }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const n = Math.min(Number(searchParams.get("n") ?? 20), 100);

  try {
    // VPS bridge endpoint: GET /logs?n=N
    // Response: { count: N, logs: [{ ts, level, msg, ... }] }
    const res = await fetch(`${HERMES_VPS_URL}/logs?n=${n}`, {
      method: "GET",
      headers: { "Authorization": `Bearer ${HERMES_VPS_TOKEN}` },
      signal: AbortSignal.timeout(5_000),
    });

    const data = await res.json().catch(() => ({})) as {
      count?: number;
      logs?: { ts: string; level: string; msg: string; [key: string]: unknown }[];
    };

    return NextResponse.json({
      ok: true,
      count: data.count ?? 0,
      logs: data.logs ?? [],
    });
  } catch (e) {
    const err = e as Error;
    return NextResponse.json({
      ok: false,
      reason: err.message,
      logs: [],
    }, { status: 502 });
  }
}
