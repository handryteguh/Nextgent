import { NextResponse } from "next/server";
import { db } from "@/db";
import { aiLogs } from "@/db/schema";
import { isAuthed } from "@/lib/auth";
import { desc } from "drizzle-orm";

// GET /api/automation/ai-logs — ambil log percakapan AI CS
export async function GET() {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = db.select().from(aiLogs).orderBy(desc(aiLogs.createdAt)).limit(100).all();
  return NextResponse.json({ data: rows });
}
