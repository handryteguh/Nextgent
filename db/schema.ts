import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

/* ============================================================
   Mina-UI Schema v1 (Phase 1)
   PRD v0.4.1 — CRM + WA dengan Automatic Follow-up
   Semua tabel pakai timestamp UTC (integer ms) + updatedAt auto.
   ============================================================ */

// ---------- AUTH ----------
export const auth = sqliteTable("auth", {
  id: integer("id").primaryKey(),
  pinHash: text("pin_hash").notNull(), // scrypt hash, 1 baris aja
  failedAttempts: integer("failed_attempts").notNull().default(0),
  lockUntil: integer("lock_until"), // ms epoch, null = gak lock
  updatedAt: integer("updated_at").notNull().default(sql`(unixepoch() * 1000)`),
});

// ---------- CONTACTS ----------
export const contacts = sqliteTable("contacts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  phone: text("phone").notNull().unique(), // format 62xxx, tanpa + / spasi
  status: text("status", { enum: ["lead", "customer", "unsubscribed"] })
    .notNull()
    .default("lead"), // unsubscribed = gak di-FU / di-blast
  note: text("note"),
  source: text("source"), // "manual" | "chat" | "import"
  createdAt: integer("created_at").notNull().default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at").notNull().default(sql`(unixepoch() * 1000)`),
});

// ---------- FOLLOW-UP SEQUENCE ----------
export const sequences = sqliteTable("sequences", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().default("Sales Cadence Default"),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  trigger: text("trigger", {
    enum: ["new_contact", "deal_stage", "manual"],
  })
    .notNull()
    .default("new_contact"),
  stopOnReply: integer("stop_on_reply", { mode: "boolean" })
    .notNull()
    .default(true),
  createdAt: integer("created_at").notNull().default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at").notNull().default(sql`(unixepoch() * 1000)`),
});

export const sequenceSteps = sqliteTable("sequence_steps", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sequenceId: integer("sequence_id")
    .notNull()
    .references(() => sequences.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // FU1, FU2, FU3
  delayHours: integer("delay_hours").notNull(), // 24, 72, 168
  template: text("template").notNull(), // "Halo {nama}, ..."
  order: integer("order").notNull(),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
});

// ---------- FOLLOWUP JOBS ----------
// Satu baris per kontak per sequence — tracking progress di-FU
export const followupJobs = sqliteTable("followup_jobs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  contactId: integer("contact_id")
    .notNull()
    .references(() => contacts.id, { onDelete: "cascade" }),
  sequenceId: integer("sequence_id")
    .notNull()
    .references(() => sequences.id, { onDelete: "cascade" }),
  currentStep: integer("current_step").notNull().default(0), // index step berikutnya (0 = belum mulai)
  status: text("status", {
    enum: ["active", "paused", "stopped", "completed", "failed"],
  })
    .notNull()
    .default("active"),
  nextSendAt: integer("next_send_at"), // ms epoch kapan step berikutnya dikirim
  lastSentAt: integer("last_sent_at"), // ms epoch terakhir berhasil kirim
  stoppedReason: text("stopped_reason"), // "replied" | "manual" | "unsubscribed" | "max_retry"
  retryCount: integer("retry_count").notNull().default(0),
  createdAt: integer("created_at").notNull().default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at").notNull().default(sql`(unixepoch() * 1000)`),
});

// ---------- DEALS ----------
export const deals = sqliteTable("deals", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  value: integer("value").notNull().default(0), // IDR
  status: text("status", { enum: ["open", "won", "lost"] })
    .notNull()
    .default("open"),
  stage: text("stage", {
    enum: ["New", "Contacted", "Qualified", "Proposal", "Negotiation"],
  })
    .notNull()
    .default("New"),
  contactId: integer("contact_id").references(() => contacts.id, {
    onDelete: "set null",
  }),
  expectedClose: text("expected_close"), // ISO date
  wonAt: integer("won_at"),
  lostReason: text("lost_reason"),
  notes: text("notes"),
  createdAt: integer("created_at").notNull().default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at").notNull().default(sql`(unixepoch() * 1000)`),
});

// ---------- TASKS ----------
export const tasks = sqliteTable("tasks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type", { enum: ["call", "whatsapp", "email", "internal"] })
    .notNull()
    .default("internal"),
  priority: text("priority", { enum: ["low", "medium", "high"] })
    .notNull()
    .default("medium"),
  status: text("status", {
    enum: ["pending", "in_progress", "done", "cancelled"],
  })
    .notNull()
    .default("pending"),
  dueAt: integer("due_at").notNull(),
  contactId: integer("contact_id").references(() => contacts.id, {
    onDelete: "set null",
  }),
  dealId: integer("deal_id").references(() => deals.id, {
    onDelete: "set null",
  }),
  completedAt: integer("completed_at"),
  createdAt: integer("created_at").notNull().default(sql`(unixepoch() * 1000)`),
});

// ---------- SETTINGS (key-value) ----------
export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value"), // JSON string
  updatedAt: integer("updated_at").notNull().default(sql`(unixepoch() * 1000)`),
});
