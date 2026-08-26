import { NextRequest, NextResponse } from "next/server";
import { verifyLogin } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const pin = body?.pin;

  if (typeof pin !== "string" || !/^\d{4,8}$/.test(pin)) {
    return NextResponse.json({ error: "PIN harus 4–8 digit angka" }, { status: 400 });
  }

  const result = await verifyLogin(pin);
  if (result.ok) {
    return NextResponse.json({ ok: true });
  }
  if (result.error === "locked") {
    return NextResponse.json(
      { error: `Terlalu banyak percobaan. Coba lagi dalam ${result.minutes} menit.`, locked: true, minutes: result.minutes },
      { status: 429 }
    );
  }
  return NextResponse.json(
    { error: "PIN salah", remaining: result.remaining },
    { status: 401 }
  );
}
