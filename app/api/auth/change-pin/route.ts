import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { auth } from "@/db/schema";
import { isAuthed, hashPin, verifyPin } from "@/lib/auth";
import { eq } from "drizzle-orm";

// POST /api/auth/change-pin
export async function POST(req: NextRequest) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const currentPin = body?.currentPin;
  const newPin = body?.newPin;

  if (typeof currentPin !== "string" || !/^\d{4,8}$/.test(currentPin))
    return NextResponse.json({ error: "PIN lama harus 4–8 digit angka" }, { status: 400 });
  if (typeof newPin !== "string" || !/^\d{4,8}$/.test(newPin))
    return NextResponse.json({ error: "PIN baru harus 4–8 digit angka" }, { status: 400 });
  if (currentPin === newPin)
    return NextResponse.json({ error: "PIN baru harus berbeda dari PIN lama" }, { status: 400 });

  const row = db.select().from(auth).limit(1).get();
  if (!row) return NextResponse.json({ error: "Auth record tidak ditemukan" }, { status: 500 });

  if (!verifyPin(currentPin, row.pinHash))
    return NextResponse.json({ error: "PIN lama salah" }, { status: 401 });

  const newHash = hashPin(newPin);
  db.update(auth)
    .set({ pinHash: newHash, failedAttempts: 0, lockUntil: null, updatedAt: Date.now() })
    .where(eq(auth.id, row.id))
    .run();

  return NextResponse.json({ ok: true });
}
