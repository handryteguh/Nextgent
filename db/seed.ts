/**
 * Seed awal Mina-UI — Phase 1
 * Jalankan: npx tsx db/seed.ts
 * Bikin: PIN default (1234, bisa diganti), sequence FU default, 3 kontak contoh.
 */
import { db, sqlite } from "./index";
import { auth, sequences, sequenceSteps, contacts } from "./schema";
import crypto from "crypto";

// scrypt hash — fungsi yang sama dipakai di login
export function hashPin(pin: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(pin, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

// Hanya seed kalau auth masih kosong (idempotent)
const existing = db.select().from(auth).all();
if (existing.length === 0) {
  db.insert(auth).values({ pinHash: hashPin("1234") }).run();
  console.log("✓ PIN default dibuat: 1234 (ganti di /settings)");
} else {
  console.log("⏭ auth sudah ada, skip PIN");
}

// Sequence default FU1 → FU2 → FU3
const seqCount = db.select().from(sequences).all();
if (seqCount.length === 0) {
  const seqId = db
    .insert(sequences)
    .values({
      name: "Sales Cadence Default",
      enabled: true,
      trigger: "new_contact",
      stopOnReply: true,
    })
    .returning({ id: sequences.id })
    .get().id;

  db.insert(sequenceSteps)
    .values([
      {
        sequenceId: seqId,
        name: "FU1",
        delayHours: 24,
        order: 1,
        template:
          "Halo {nama}, terima kasih sudah menghubungi kami! Ada yang bisa kami bantu hari ini?",
      },
      {
        sequenceId: seqId,
        name: "FU2",
        delayHours: 72,
        order: 2,
        template:
          "Halo {nama}, sekadar follow-up ya. Masih tertarik dengan penawaran kami? 😊",
      },
      {
        sequenceId: seqId,
        name: "FU3",
        delayHours: 168,
        order: 3,
        template:
          "Halo {nama}, ini follow-up terakhir dari kami. Kalau butuh info lebih lanjut, kabari saja ya 🙏",
      },
    ])
    .run();
  console.log("✓ Sequence FU1/FU2/FU3 dibuat");
} else {
  console.log("⏭ sequence sudah ada, skip");
}

// 3 kontak contoh (hanya kalau tabel contacts masih kosong)
const contactCount = db.select().from(contacts).all();
if (contactCount.length === 0) {
  db.insert(contacts)
    .values([
      { name: "Budi Santoso", phone: "6281234567890", status: "lead", source: "manual", note: "Tanya harga paket Pro" },
      { name: "Siti Rahma", phone: "6289876543210", status: "customer", source: "manual", note: "Sudah beli paket Basic" },
      { name: "Andi Wijaya", phone: "6281112223334", status: "lead", source: "chat", note: "Inbound dari WA" },
    ])
    .run();
  console.log("✓ 3 kontak contoh dibuat");
} else {
  console.log("⏭ kontak sudah ada, skip");
}

console.log("\n✅ Seed selesai.");
sqlite.close();
