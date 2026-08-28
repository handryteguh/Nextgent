import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";

const HERMES_VPS_URL = process.env.HERMES_VPS_URL ?? "";
const HERMES_VPS_TOKEN = process.env.HERMES_VPS_TOKEN ?? "";

// GET /api/wa/test — ping Hermes VPS, return status detail
export async function GET() {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!HERMES_VPS_URL) {
    return NextResponse.json({
      ok: false,
      connected: false,
      reason: "HERMES_VPS_URL belum diset di .env.local",
      url: null,
    });
  }

  try {
    // Ping /api/health dulu (public, no auth needed)
    const healthRes = await fetch(`${HERMES_VPS_URL}/api/health`, {
      method: "GET",
      signal: AbortSignal.timeout(5_000),
    });

    if (!healthRes.ok) {
      return NextResponse.json({
        ok: false,
        connected: false,
        reason: `Hermes VPS HTTP ${healthRes.status}`,
        url: HERMES_VPS_URL,
      });
    }

    const health = await healthRes.json().catch(() => ({})) as {
      ok?: boolean;
      version?: string;
      auth_required?: boolean;
    };

    // Cek WA gateway status (butuh token)
    let waConnected = false;
    let waReason = "Token tidak diset";

    if (HERMES_VPS_TOKEN && HERMES_VPS_TOKEN !== "changeme-vps-token") {
      try {
        const statusRes = await fetch(`${HERMES_VPS_URL}/api/status`, {
          method: "GET",
          headers: { Authorization: `Bearer ${HERMES_VPS_TOKEN}` },
          signal: AbortSignal.timeout(8_000),
        });
        if (statusRes.ok) {
          const status = await statusRes.json().catch(() => ({})) as {
            gateway?: { connected?: boolean; wa_connected?: boolean };
            wa?: { connected?: boolean };
          };
          waConnected = status?.gateway?.wa_connected ?? status?.wa?.connected ?? false;
          waReason = waConnected ? "WA terhubung" : "WA belum scan QR";
        } else if (statusRes.status === 401) {
          waReason = "Token salah atau expired";
        }
      } catch {
        waReason = "Timeout saat cek WA status";
      }
    }

    return NextResponse.json({
      ok: true,
      connected: true,
      hermes_version: health.version ?? "unknown",
      wa_connected: waConnected,
      wa_reason: waReason,
      url: HERMES_VPS_URL,
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({
      ok: false,
      connected: false,
      reason: msg.includes("timeout") ? "Timeout — VPS tidak respond dalam 5s" : `Gagal connect: ${msg}`,
      url: HERMES_VPS_URL,
    });
  }
}
