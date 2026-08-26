/**
 * lib/session.ts — Edge-safe session helpers
 * TIDAK import better-sqlite3 atau db/index — bisa dipakai di middleware.
 */
import crypto from "crypto";

export const SESSION_COOKIE_NAME = "mina_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 hari
const SESSION_SECRET =
  process.env.SESSION_SECRET || "mina-ui-dev-secret-change-me";

function sign(data: string): string {
  return crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(data)
    .digest("hex");
}

/** Buat payload cookie (dipanggil dari lib/auth.ts setelah login sukses) */
export function makeSessionValue(): string {
  const expiry = `${Date.now() + SESSION_TTL_MS}`;
  return `${expiry}.${sign(expiry)}`;
}

/** Pure cookie verification — bisa jalan di Edge runtime */
export function verifySessionCookie(raw: string | undefined): boolean {
  if (!raw) return false;
  const dot = raw.lastIndexOf(".");
  if (dot < 0) return false;
  const expiry = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  const expected = sign(expiry);
  const sigBuf = Buffer.from(sig, "hex");
  const expBuf = Buffer.from(expected, "hex");
  if (sigBuf.length !== expBuf.length) return false;
  if (!crypto.timingSafeEqual(sigBuf, expBuf)) return false;
  return Number(expiry) > Date.now();
}
