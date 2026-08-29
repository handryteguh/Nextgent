import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";

const HERMES_VPS_URL = process.env.HERMES_VPS_URL ?? "";
const HERMES_VPS_TOKEN = process.env.HERMES_VPS_TOKEN ?? "";

export type WaBridgeContact = {
  jid: string;
  phone: string;
  name: string | null;
  isGroup: boolean;
};

// GET /api/wa/contacts — pull daftar kontak dari VPS bridge
export async function GET() {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!HERMES_VPS_URL || !HERMES_VPS_TOKEN) {
    return NextResponse.json({ ok: false, reason: "HERMES_VPS_URL/TOKEN belum diset" }, { status: 503 });
  }

  try {
    const res = await fetch(`${HERMES_VPS_URL}/contacts`, {
      headers: { Authorization: `Bearer ${HERMES_VPS_TOKEN}` },
      signal: AbortSignal.timeout(8_000),
    });

    if (!res.ok) {
      return NextResponse.json({ ok: false, reason: `VPS responded ${res.status}` }, { status: 502 });
    }

    const data = await res.json().catch(() => ({})) as {
      count?: number;
      contacts?: Array<{
        jid?: string;
        phone?: string;
        lid?: string;
        name?: string | null;
        isGroup?: boolean;
      }>;
    };

    // Normalize — VPS bisa kirim format {jid, lid, name} atau {jid, phone, name, isGroup}
    const raw = data.contacts ?? [];
    const contacts = raw.map((c) => {
      const jid = c.jid ?? "";
      const phone = c.phone ?? jid.replace("@s.whatsapp.net", "").replace("@g.us", "");
      const isGroup = c.isGroup ?? jid.endsWith("@g.us");
      return {
        jid,
        phone,
        name: c.name ?? null,
        isGroup,
      };
    }).filter((c) => !c.isGroup && c.phone.startsWith("62") && c.phone.length >= 10);

    return NextResponse.json({
      ok: true,
      count: contacts.length,
      contacts,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, reason: (e as Error).message }, { status: 502 });
  }
}
