// @ts-check
/* eslint-disable @typescript-eslint/no-require-imports */
const Database = require("better-sqlite3");
const path = require("path");

const db = new Database(path.join(__dirname, "../data/mina-ui.db"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Cek tabel yang udah ada
const tables = db
  .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
  .all()
  .map((t) => t.name);

console.log("Existing tables:", tables.join(", "));

// Buat followup_jobs kalau belum ada
if (!tables.includes("followup_jobs")) {
  db.exec(`
    CREATE TABLE followup_jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      contact_id INTEGER NOT NULL,
      sequence_id INTEGER NOT NULL,
      current_step INTEGER DEFAULT 0 NOT NULL,
      status TEXT DEFAULT 'active' NOT NULL,
      next_send_at INTEGER,
      last_sent_at INTEGER,
      stopped_reason TEXT,
      retry_count INTEGER DEFAULT 0 NOT NULL,
      created_at INTEGER DEFAULT (unixepoch() * 1000) NOT NULL,
      updated_at INTEGER DEFAULT (unixepoch() * 1000) NOT NULL,
      FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
      FOREIGN KEY (sequence_id) REFERENCES sequences(id) ON DELETE CASCADE
    )
  `);
  console.log("✅ Created table: followup_jobs");
} else {
  console.log("ℹ️  Table followup_jobs already exists, skip.");
}

// Verifikasi akhir
const final = db
  .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
  .all()
  .map((t) => t.name);
console.log("Final tables:", final.join(", "));
db.close();
