import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { autoRules } from "@/db/schema";
import { isAuthed } from "@/lib/auth";
import { desc } from "drizzle-orm";

// GET /api/automation/rules
export async function GET() {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = db.select().from(autoRules).orderBy(desc(autoRules.createdAt)).all();
  return NextResponse.json({ data: rows });
}

// POST /api/automation/rules
export async function POST(req: NextRequest) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const keyword = body?.keyword?.trim();
  const reply = body?.reply?.trim();
  if (!keyword || !reply) return NextResponse.json({ error: "keyword dan reply wajib" }, { status: 400 });
  const [row] = await db.insert(autoRules).values({ keyword, reply, enabled: true, hits: 0 }).returning();
  return NextResponse.json({ data: row }, { status: 201 });
}
