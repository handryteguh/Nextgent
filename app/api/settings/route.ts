import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { isAuthed } from "@/lib/auth";
import {} from "drizzle-orm";

// Keys yang valid di settings table
const ALLOWED_KEYS = [
  "fu_delay_1",   // jam FU1 (default 24)
  "fu_delay_2",   // jam FU2 (default 72)
  "fu_delay_3",   // jam FU3 (default 168)
  "send_start",   // jam mulai kirim (default "08:00")
  "send_stop",    // jam berhenti kirim (default "20:00")
  "app_version",  // read-only
] as const;

type SettingKey = typeof ALLOWED_KEYS[number];

// GET /api/settings — return semua settings sebagai object
export async function GET() {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = db.select().from(settings).all();
  const data: Record<string, string | null> = {};
  for (const row of rows) data[row.key] = row.value;

  // Isi default kalau belum ada
  const defaults: Record<SettingKey, string> = {
    fu_delay_1: "24",
    fu_delay_2: "72",
    fu_delay_3: "168",
    send_start: "08:00",
    send_stop: "20:00",
    app_version: "0.1.0",
  };
  for (const [k, v] of Object.entries(defaults)) {
    if (data[k] === undefined) data[k] = v;
  }

  return NextResponse.json({ data });
}

// PUT /api/settings — upsert satu atau beberapa key
export async function PUT(req: NextRequest) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object")
    return NextResponse.json({ error: "Body harus JSON object" }, { status: 400 });

  const now = Date.now();
  const saved: string[] = [];
  const skipped: string[] = [];

  for (const [key, value] of Object.entries(body)) {
    if (!ALLOWED_KEYS.includes(key as SettingKey) || key === "app_version") {
      skipped.push(key);
      continue;
    }
    db.insert(settings)
      .values({ key, value: String(value), updatedAt: now })
      .onConflictDoUpdate({ target: settings.key, set: { value: String(value), updatedAt: now } })
      .run();
    saved.push(key);
  }

  return NextResponse.json({ ok: true, saved, skipped });
}
