import { db } from "@/db";
import { auth } from "@/db/schema";
import crypto from "crypto";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import {
  SESSION_COOKIE_NAME,
  makeSessionValue,
  verifySessionCookie,
} from "./session";

// ============================================================
// Auth Mina-UI — PIN login + lockout (PRD v0.4.1)
// - PIN di-hash pakai scrypt (salt:hash)
// - 5x salah → lock 5 menit (lockUntil = now + 5min)
// - Session pakai signed cookie (HMAC), 7 hari
//   (implementasi cookie ada di lib/session.ts — edge-safe)
// ============================================================

const MAX_ATTEMPTS = 5;
const LOCK_MS = 5 * 60 * 1000; // 5 menit

export function hashPin(pin: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(pin, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPin(pin: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = crypto.scryptSync(pin, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(candidate, "hex"), Buffer.from(hash, "hex"));
}

/** Cek lockout. Return menit sisa kalau masih lock, null kalau aman. */
export function getLockRemaining(row: { lockUntil: number | null }): number | null {
  if (!row.lockUntil) return null;
  const remain = row.lockUntil - Date.now();
  return remain > 0 ? Math.ceil(remain / 1000 / 60) : null;
}

/**
 * Verifikasi PIN dari user. Update failedAttempts / lockUntil di DB.
 * Return:
 *  { ok: true }                    → PIN benar, session dibikin
 *  { ok: false, error: "locked",  minutes } → masih lock
 *  { ok: false, error: "invalid", remaining } → PIN salah, sisa percobaan
 */
export async function verifyLogin(pin: string): Promise<
  | { ok: true }
  | { ok: false; error: "locked"; minutes: number }
  | { ok: false; error: "invalid"; remaining: number }
> {
  const row = db.select().from(auth).limit(1).get();
  if (!row) return { ok: false, error: "invalid", remaining: 0 };

  // Cek lock dulu
  const lock = getLockRemaining(row);
  if (lock !== null) return { ok: false, error: "locked", minutes: lock };

  if (verifyPin(pin, row.pinHash)) {
    // Reset counter + bikin session
    db.update(auth)
      .set({ failedAttempts: 0, lockUntil: null, updatedAt: Date.now() })
      .where(eq(auth.id, row.id))
      .run();
    await createSession();
    return { ok: true };
  }

  // PIN salah → increment
  const newAttempts = row.failedAttempts + 1;
  const willLock = newAttempts >= MAX_ATTEMPTS;
  db.update(auth)
    .set({
      failedAttempts: willLock ? 0 : newAttempts,
      lockUntil: willLock ? Date.now() + LOCK_MS : null,
      updatedAt: Date.now(),
    })
    .where(eq(auth.id, row.id))
    .run();

  if (willLock) return { ok: false, error: "locked", minutes: 5 };
  return { ok: false, error: "invalid", remaining: MAX_ATTEMPTS - newAttempts };
}

// ---------- Session ----------
/** Bikin session cookie (setelah login sukses) */
async function createSession() {
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, makeSessionValue(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });
}

/** Cek session aktif (server component / route handler). */
export async function isAuthed(): Promise<boolean> {
  const store = await cookies();
  return verifySessionCookie(store.get(SESSION_COOKIE_NAME)?.value);
}

export async function destroySession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE_NAME);
}
