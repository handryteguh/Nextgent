/**
 * lib/session.ts — Edge-safe session helpers
 * Pakai Web Crypto API (tersedia di Edge + Node.js) — TIDAK pakai Node crypto builtin.
 */

export const SESSION_COOKIE_NAME = "mina_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 hari

function getSecret(): string {
  return process.env.SESSION_SECRET || "mina-ui-dev-secret-change-me";
}

/** Import HMAC key dari secret string (Web Crypto, edge-safe) */
async function getKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    enc.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function buf2hex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hex2buf(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2)
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  return bytes;
}

/** Buat payload cookie (dipanggil dari lib/auth.ts setelah login sukses) */
export async function makeSessionValue(): Promise<string> {
  const expiry = `${Date.now() + SESSION_TTL_MS}`;
  const key = await getKey();
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(expiry));
  return `${expiry}.${buf2hex(sig)}`;
}

/** Pure async cookie verification — jalan di Edge runtime & Node.js */
export async function verifySessionCookie(raw: string | undefined): Promise<boolean> {
  if (!raw) return false;
  const dot = raw.lastIndexOf(".");
  if (dot < 0) return false;
  const expiry = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  if (Number(expiry) <= Date.now()) return false;
  try {
    const key = await getKey();
    return await crypto.subtle.verify(
      "HMAC",
      key,
      hex2buf(sig).buffer as ArrayBuffer,
      new TextEncoder().encode(expiry)
    );
  } catch {
    return false;
  }
}
