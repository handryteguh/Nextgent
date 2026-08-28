import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { activityLogs } from "@/db/schema";
import { isAuthed } from "@/lib/auth";
import { desc, sql } from "drizzle-orm";

// GET /api/logs — ambil activity log, support filter & pagination
export async function GET(req: NextRequest) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const filter = searchParams.get("filter") ?? "semua"; // semua | ok | fail | warn
  const limit = Math.min(Number(searchParams.get("limit") ?? 100), 500);

  const rows = db
    .select()
    .from(activityLogs)
    .orderBy(desc(activityLogs.createdAt))
    .limit(limit)
    .all()
    .filter((r) => filter === "semua" || r.status === filter);

  // Count per status
  const counts = db.all(sql`
    SELECT status, COUNT(*) as count FROM activity_logs GROUP BY status
  `) as { status: string; count: number }[];

  const total = db.all(sql`SELECT COUNT(*) as count FROM activity_logs`) as { count: number }[];

  return NextResponse.json({
    data: rows,
    meta: {
      total: total[0]?.count ?? 0,
      counts: Object.fromEntries(counts.map((c) => [c.status, c.count])),
    },
  });
}

// POST /api/logs — tulis log dari mana saja (internal use)
export async function POST(req: NextRequest) {
  // Bisa dari webhook internal atau server-side action
  const secret = req.headers.get("x-internal-secret") ?? "";
  if (secret !== (process.env.WEBHOOK_SECRET ?? "changeme-secret")) {
    // Juga accept session auth
    if (!(await isAuthed())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const body = await req.json().catch(() => null);
  if (!body?.action) return NextResponse.json({ error: "action wajib" }, { status: 400 });

  const [row] = await db.insert(activityLogs).values({
    actor: body.actor ?? "system",
    action: body.action,
    entity: body.entity ?? null,
    entityId: body.entityId ?? null,
    detail: body.detail ?? null,
    status: body.status ?? "ok",
    ip: body.ip ?? null,
  }).returning();

  return NextResponse.json({ data: row }, { status: 201 });
}
