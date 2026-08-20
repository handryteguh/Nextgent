# PRD: Mina-UI — CRM + WhatsApp dengan Automatic Follow-up

**Versi**: v0.2 (Draft)
**Tanggal**: 6 Agustus 2026
**Status**: 🔵 Draft — menunggu review Bang Handry
**Owner**: Bang Handry
**Tech Stack**: Next.js 16.3.0 (Turbopack) · React 19.2 · Tailwind 4 · TypeScript · **SQLite + Drizzle ORM** · WhatsApp Bridge (Baileys, service terpisah di VPS) · Scheduler (in-process)

**Keputusan Arsitektur (v0.3)**: WA Bridge = service mandiri yang jalan 24/7 di VPS `solusiadmin-core-vps`. Komunikasi dengan Mina-UI via **REST (kirim pesan) + Webhook (event masuk)**. MCP disimpan untuk fase CS bot AI (Hermes → bridge sebagai tool).

**Positioning (v0.3)**: Mina-UI = **backend MVP pribadi Bang Handry** (single-user, self-hosted, data 100% lokal). **BUKAN SaaS multi-tenant.** Konsep "banyak pengguna masing-masing connect nomor WA mereka" = red ocean (Fonnte, Wablas dll) → **ditunda, bukan fokus**. Arsitektur bridge multi-number-ready tetap dijaga biar opsi ini gak tertutup kalau nanti mau dieksplor.

---

## 1. Ringkasan Eksekutif

Mina-UI adalah **CRM tools sederhana + WhatsApp chatbot (QR code, unofficial) dengan fitur flagship: Automatic Follow-up Sequence (FU1 → FU2 → FU3)**.

**Keputusan kanal (v1): WhatsApp ONLY.** Telegram sempat dipertimbangkan sebagai kanal CS 24/7 (lebih stabil & gratis), tapi customer Indonesia mayoritas di WhatsApp — jadi v1 fokus penuh ke WhatsApp. Arsitektur tetap dibuat channel-agnostic (ada layer abstraksi MessageService), biar nanti kalau mau tambah Telegram/Email tinggal nambah adapter tanpa rombak.

Pasar CRM+WA udah ramai (Fonnte, Wablas, dll), tapi mayoritas cuma **blast tools** — kirim pesan massal, sisanya manual. Mina-UI beda: fokus ke **sales cadence engine** — setiap lead yang masuk otomatis di-follow-up berkala dengan jeda manusiawi, sampai customer balas atau sequence selesai.

**Kenapa ini aman dari banned**: follow-up dikirim ke kontak yang **sudah pernah interaksi** (warm leads), bukan nomor random. Ini pola yang paling aman di WhatsApp unofficial.

---

## 2. Problem Statement

| # | Problem | Dampak |
|---|---------|--------|
| P1 | Kontak & percakapan WA tersebar di HP / aplikasi lain | Susah tracking follow-up, kehilangan konteks |
| P2 | Follow-up customer sering kelewat / gak konsisten | Lead dingin, penjualan hilang |
| P3 | Chatbot WA API resmi mahal & ribet (business API, approval) | UMKM susah mulai |
| P4 | Tool WA unofficial (Fonnte dll) cuma blast, gak ada cadence | Tetap harus manual follow-up |
| P5 | CRM mahal (HubSpot dll) gak ada integrasi WA murah | Budget terbatas |

---

## 3. Goals & Non-Goals

### Goals
- G1: CRM lengkap: Contacts, Deals/Pipeline, Tasks, Notes
- G2: WhatsApp terintegrasi: QR login, inbox, kirim pesan dari dashboard
- G3: **Automatic Follow-up Sequence (FU1/FU2/FU3)** — fitur flagship
- G4: Aman dari banned: warm-leads only, rate limit, delay manusiawi
- G5: Self-hosted, data 100% di server sendiri

### Non-Goals (v1)
- NG1: Multi-user / auth (v1 single-user, localhost)
- NG2: WA Business API resmi (beda scope & biaya)
- NG3: Mass blast marketing (justru bahaya banned)
- NG4: Payment gateway integrasi
- NG5: Mobile native app
- NG6: Kanal selain WhatsApp (Telegram, Email, dll) — v1 WA only; layer abstraksi disiapkan buat masa depan

---

## 4. User Stories

| ID | Role | Story | Prioritas |
|----|------|-------|-----------|
| US-1 | Owner | Saya mau scan QR buat connect WhatsApp ke dashboard | P0 |
| US-2 | Owner | Saya mau simpan & kelola kontak customer | P0 |
| US-3 | Owner | Saya mau lihat semua chat WA masuk & keluar di satu inbox | P0 |
| US-4 | Owner | Saya mau balas chat dari dashboard tanpa buka HP | P0 |
| US-5 | Owner | **Saya mau setiap lead baru otomatis masuk sequence FU1→FU2→FU3** | **P0** |
| US-6 | Owner | Saya mau sequence berhenti otomatis kalau customer balas | P0 |
| US-7 | Owner | Saya mau edit template & interval tiap step FU | P1 |
| US-8 | Owner | Saya mau lihat progress FU tiap kontak (udah FU berapa, balas apa belum) | P1 |
| US-9 | Owner | Saya mau buat deal & kelola pipeline penjualan | P1 |
| US-10 | Owner | Saya mau task & reminder follow-up manual | P1 |
| US-11 | Owner | Saya mau laporan response rate per step FU | P2 |

---

## 5. Fitur (Scope v1)

### 5.1 WhatsApp Connection (QR Login) — P0
- Halaman koneksi: tampilkan QR code untuk scan via WhatsApp (Linked Devices)
- Status: connected / disconnected / reconnecting
- Auto-relink QR saat session expired
- Session persist (file/DB) — gak perlu scan ulang tiap restart
- **Satu nomor WA aktif** di v1 (arsitektur multi-number ready)

### 5.2 Contacts (CRM) — P0
- CRUD kontak: nama, nomor HP, email, tags, notes, source
- Import kontak: manual / CSV
- **Auto-create kontak** dari chat WA masuk
- Search & filter: by name, tag, date
- **Status FU per kontak** (lihat section 5.6)

### 5.3 WhatsApp Inbox & Chat — P0
- Inbox: list percakapan, unread badge, search
- Chat view: bubble UI, kirim teks, status (sent/delivered/read)
- **Auto-save semua chat ke DB** — history aman walau reconnect
- Lampiran: preview gambar (v1)

### 5.4 ⭐ Automatic Follow-up Sequence (FLAGSHIP) — P0
**Inti produk. Lead masuk → otomatis di-FU sampai balas atau sequence selesai.**

#### 5.4.1 Konsep
- **Sequence** = rangkaian step follow-up dengan jeda tertentu
- Setiap **step** = {nama, delay, template pesan}
- Kontak yang trigger masuk sequence → tiap step terkirim otomatis sesuai jadwal

#### 5.4.2 Default sequence (bisa diedit)
| Step | Jeda | Template (default) |
|------|------|--------------------|
| FU1 | H+1 | "Halo {nama}, makasih udah hubungi kami. Ada yang bisa kami bantu soal {topik}?" |
| FU2 | H+3 | "Halo {nama}, follow-up nih — gimana {topik}? Kami bisa bantu kalau masih butuh." |
| FU3 | H+7 | "Halo {nama}, ini follow-up terakhir dari kami soal {topik}. Kabarin aja kalau masih minat ya." |

#### 5.4.3 Trigger (kapan kontak masuk sequence)
- [ ] Kontak baru masuk (auto-create dari chat WA)
- [ ] Deal masuk stage tertentu (misal "New")
- [ ] Manual: tambah kontak ke sequence dari halaman kontak

#### 5.4.4 Stop rules (otomatis)
- 🛑 **Customer balas** → sequence berhenti (default; bisa di-set "lanjut ke step berikutnya")
- 🛑 Customer kirim kata berhenti ("stop", "berhenti", "jangan") → **unsubscribe permanen**
- 🛑 Deal won/lost → sequence berhenti

#### 5.4.5 Safety engine (anti-banned)
- ⏰ Kirim hanya jam **08:00–20:00** (di luar jam → ditunda ke jam berikutnya)
- 🎲 **Delay random ±20%** (H+1 jadi 20–28 jam) — gak keliatan bot
- 📩 **Max 1 pesan FU per kontak per hari**
- ✅ **Hanya ke kontak warm** (pernah interaksi) — default on, gak bisa blast ke nomor acak
- 📵 **Unsubscribe list** — kontak yang minta berhenti gak akan di-FU lagi

#### 5.4.6 Dashboard progress
- List kontak dalam sequence: status (Menunggu FU1 / FU1 terkirim / FU2 terkirim / FU3 terkirim / Balas / Selesai)
- Klik kontak → lihat riwayat FU + balasan customer
- **Metric**: response rate per step (berapa % kontak balas setelah FU1, FU2, FU3)

### 5.5 Deals & Pipeline — P1
- Pipeline: stages configurable (New → Contacted → Qualified → Won/Lost)
- Kanban board: drag & drop deal antar stage
- Deal: nama, nilai, kontak terkait, stage, notes, expected close date
- **Integrasi**: deal pindah stage bisa trigger/stop sequence

### 5.6 Tasks & Follow-up Manual — P1
- Task CRUD: judul, kontak terkait, due date, priority, status
- Reminder: task due hari ini / overdue
- Integrasi: buka chat kontak langsung dari task

### 5.7 Chatbot Automation — P1
- **Auto-reply**: pesan masuk → balas otomatis (teks statis)
- **Keyword trigger**: "harga" → template jawaban; "alamat" → template jawaban
- **Business hours**: auto-reply hanya di jam kerja (opsional)
- **Template messages**: simpan pesan reusable

### 5.8 Broadcast (Aman) — P2
- Kirim pesan ke multiple kontak (max 50/batch)
- Rate limit + delay random 30-60s
- Exclusion list (unsubscribe + kontak yang belum interaksi = gak boleh di-blast)
- **Catatan**: broadcast BUKAN fitur utama — follow-up sequence yang utama

### 5.9 Report & Dashboard — P2
- Summary: total kontak, chat hari ini, deal aktif, task overdue
- **Follow-up funnel**: berapa kontak masuk → balas di FU1/FU2/FU3 → selesai
- Chart: chat per hari, kontak baru per minggu
- Laporan deal: won/lost, nilai total

---

## 6. Arsitektur

```
┌─────────────────────────────────────────────────┐
│              Browser (Next.js UI)                │
│  /  /contacts  /inbox  /chat/[id]  /deals       │
│  /tasks  /automation  /followup  /reports       │
│  /settings/wa (QR connect)                      │
└──────────────────────┬──────────────────────────┘
                       │ fetch (REST, polling)
┌──────────────────────▼──────────────────────────┐
│            Next.js API Routes                   │
│  /api/wa/qr · /api/wa/send · /api/wa/messages   │
│  /api/contacts · /api/deals · /api/tasks        │
│  /api/automation · /api/broadcast               │
│  /api/followup/sequences · /api/followup/run    │
└──────────────────────┬──────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────┐
│            Mina-UI Core Services (Node)         │
│  ┌─────────────┐  ┌──────────────────────────┐  │
│  │ WA Gateway  │  │ Follow-up Scheduler      │  │
│  │ (Baileys)   │  │ tick tiap menit:         │  │
│  │ QR · session│  │ cek step yang jatuh      │  │
│  │ event hooks │  │ tempo → kirim → update   │  │
│  └──────┬──────┘  └───────────┬──────────────┘  │
│         │                     │                 │
│  ┌──────▼─────────────────────▼──────────────┐  │
│  │ SQLite (Drizzle ORM)                      │  │
│  │ contacts · messages · deals · tasks       │  │
│  │ sequences · steps · runs · unsubscribes   │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### Komponen kunci
- **WA Gateway (Baileys)**: QR login, session persist, event `messages.upsert` → simpan ke DB + trigger engine
- **Follow-up Scheduler**: loop tiap menit → cari step yang `due_at <= now` → kirim via gateway → update status
- **Safety Engine**: validasi jam kirim, delay random, max per hari, unsubscribe check — **semua kirim lewat sini, gak ada bypass**
- **DB**: SQLite (file-based) — simpel, backup = copy file

### Arsitektur WA Bridge (v0.3)

```
VPS solusiadmin-core-vps (WA harus hidup 24/7)
┌──────────────────────────────────────────┐
│  WA BRIDGE (service mandiri, Baileys)     │
│  • QR connect — scan sekali               │
│  • Session persist (aman restart)         │
│  • REST API: POST /send, GET /status      │
│  • Webhook keluar → event ke Mina-UI      │
└───────────────┬──────────────────────────┘
                │ pesan masuk / status kirim (Webhook)
                ▼
        MINA-UI (Next.js + SQLite)
        • REST client → bridge (kirim pesan)
        • Webhook handler → simpan + trigger FU engine
```

**Alur komunikasi:**
1. **Kirim pesan** (balas chat / follow-up) → Mina-UI panggil `POST /send` di bridge
2. **Pesan masuk** → bridge kirim webhook ke Mina-UI → simpan ke DB + trigger follow-up engine
3. **QR connect** → halaman Settings Mina-UI tampilkan QR dari bridge → scan sekali → session tersimpan di VPS

**Kenapa REST + Webhook (bukan MCP untuk jalur pesan):**
- MCP = protokol untuk agent AI manggil tools (Hermes → bridge sebagai CS bot). Bukan protokol real-time chat.
- REST + Webhook = pola standar, ringan, mudah di-debug, semua bahasa dukung.
- Bridge terpisah → restart app/deploy gak matiin koneksi WA.
- Bridge satu → banyak konsumen (Mina-UI, nanti Hermes CS bot, dll).

**Fase CS Bot AI (nanti):** Hermes di VPS nyambung ke bridge via **MCP** — agent AI baca chat & balas otomatis. Satu bridge, banyak konsumen.

---

## 7. Data Model (ringkas)

```ts
// Contact
interface Contact {
  id: string;
  name: string;
  phone: string;          // E.164
  email?: string;
  tags: string[];
  notes?: string;
  source: "manual" | "wa" | "import";
  createdAt: string;
}

// Message
interface Message {
  id: string;
  contactId: string;
  direction: "in" | "out";
  type: "text" | "image";
  body: string;
  waMessageId: string;
  status: "sent" | "delivered" | "read";
  createdAt: string;
}

// ⭐ Follow-up Sequence
interface FollowUpSequence {
  id: string;
  name: string;            // "Sales Cadence Default"
  enabled: boolean;
  steps: FollowUpStep[];   // [FU1, FU2, FU3]
  trigger: "new_contact" | "deal_stage" | "manual";
  stopOnReply: boolean;    // default true
}

interface FollowUpStep {
  id: string;
  name: string;            // "FU1"
  delayHours: number;      // 24, 72, 168
  template: string;        // "Halo {nama}, ..."
  order: number;
}

// Run = instance sequence untuk 1 kontak
interface FollowUpRun {
  id: string;
  contactId: string;
  sequenceId: string;
  status: "active" | "stopped_reply" | "stopped_unsub" | "completed" | "stopped_deal";
  currentStep: number;     // 0 = belum FU1
  nextDueAt: string | null;
  lastSentAt: string | null;
  startedAt: string;
}

// Deal
interface Deal {
  id: string;
  title: string;
  value: number;
  stage: string;
  contactId?: string;
  notes?: string;
  expectedClose?: string;
}

// AutomationRule
interface AutomationRule {
  id: string;
  keyword: string;
  reply: string;
  enabled: boolean;
}

// Unsubscribe
interface Unsubscribe {
  phone: string;           // gak akan di-FU / di-blast lagi
  reason: "user_request" | "auto";
  createdAt: string;
}
```

---

## 8. UI/UX

> **SSOT UI**: `D:\DOCUMENT\Mina-UI-SSOT\` — berisi style guide + 5 gambar referensi (dashboard, login PIN, users, models, logs).
> Referensi visual: **Mina Forge** (DapurMina) — dashboard dark mode dengan aksen kuning-emas.

### 8.1 Style Guide — Dark Mode SaaS (referensi Mina Forge)

| Token | Value | Fungsi |
|---|---|---|
| `bg-base` | `#0B0E14` | Background utama |
| `bg-card` | `#10141D` | Background kartu/panel |
| `border-card` | `#1E293B` | Border kartu (1px) |
| `accent` | `#F5C044` | Kuning-emas — primary, CTA, active state |
| `accent-hover` | `#FACC15` | Kuning lebih terang — hover |
| `text-primary` | `#E2E8F0` | Teks utama |
| `text-muted` | `#94A3B8` | Teks sekunder/keterangan |
| `text-faint` | `#475569` | Teks tersier/footer |
| `success` | `#34D399` | Status OK / aktif |
| `danger` | `#FB7185` | Hapus / suspend / error |
| `info` | `#22D3EE` | Info / link |
| `violet` | `#A78BFA` | Aksen sekunder (ikon, badge) |
| `orange` | `#FB923C` | Aksen sekunder (ikon, warning) |

### 8.2 Tipografi & Komponen

- **Font**: Inter (sans-serif), fallback system-ui
- **Angka KPI**: `font-weight: 800`, ukuran besar
- **Label kecil**: uppercase, `letter-spacing`, 11-12px
- **Card**: `bg-card`, border `border-card` 1px, radius 12px, shadow subtle
- **Button primary**: `bg-accent` kuning, teks hitam `#0B0E14`, font-bold
- **Button danger**: `bg-danger/10`, teks danger, border danger/30
- **Input**: bg `#0f172a`, border `#1E293B`, radius 8px, focus ring accent
- **Badge**: rounded-full, 10-11px, padding 2-6px
- **Table**: borderless, hover `white/2`, header uppercase muted
- **Sidebar**: `bg-base`, border-right `#1E293B`, active = accent bg + indicator
- **Filter pills**: rounded-full, active = accent bg
- **Icon**: line/outline style, colorful (Font Awesome / Lucide)

### 8.3 Layout
- **Sidebar kiri (fixed, 240px)**: logo brand, nav, profile/logout di bawah
- **Header**: judul halaman + subtitle (tanggal/breadcrumb) + aksi
- **Konten utama**: grid — KPI cards row, chart row (line + donut), form + tabel

### 8.4 Halaman (Frontend Statis — Tahap Ini)

| Halaman | Route | Komponen Utama |
|---|---|---|
| Login (2 langkah) | `/login` | Logo perisai, stepper, input PIN, tombol verifikasi |
| Dashboard | `/` | KPI cards (4), line chart, donut chart |
| Contacts | `/contacts` | Search + filter pills, tabel (nama, WA, status FU, aksi) |
| Follow-up | `/followup` | Stats row, form sequence editor + tabel progress |
| Inbox | `/inbox` | 2 kolom: list chat + conversation (kayak WA Web) |
| Deals | `/deals` | Kanban drag & drop |
| Tasks | `/tasks` | Tabel task + status |
| Automation | `/automation` | Tabel rules keyword → reply |
| Reports | `/reports` | Chart + summary |
| Logs | `/logs` | Filter pills, tabel (waktu, aksi, detail, status, IP) |
| Pengaturan | `/settings` | Form settings + koneksi WA QR |

### 8.5 Halaman Login (2 Langkah)
- **Langkah 1 — Master PIN**: input PIN → verifikasi
- **Langkah 2**: verifikasi lanjutan (sesuai desain)
- Menampilkan sisa percobaan ("Percobaan ke-2/5")
- Saat lockout: form disabled + hitung mundur

---

## 9. Risiko & Mitigasi

| Risiko | Level | Mitigasi |
|--------|-------|----------|
| WA banned | 🔴 Tinggi | Warm-leads only, rate limit, delay random, jam kirim, unsubscribe, dedicated number |
| Library deprecated | 🟡 Sedang | Baileys aktif di-maintain, backup session, monitor update |
| Data hilang | 🟡 Sedang | Auto-backup SQLite, export CSV |
| Scheduler miss (app mati) | 🟡 Sedang | Due check saat startup → kirim yang terlewat (catch-up) |
| QR expired | 🟢 Rendah | Auto-refresh QR, notifikasi UI |

---

## 10. Non-Functional Requirements

| Aspek | Requirement |
|-------|-------------|
| Performance | API < 2s; chat load < 1s |
| Reliability | Gateway restart → auto-reconnect; scheduler catch-up setelah mati |
| Security | Auth: login 5x salah → lockout (cooldown 5 menit, hitung mundur, counter reset); v1: bind localhost only; session WA di VPS (bridge) |
| Testing | lint 0 error; build sukses; smoke test tiap API |
| Data | SQLite auto-backup harian |

### 10.1 Kebijakan Login (Auth & Security)

| Aturan | Nilai |
|---|---|
| Maksimal salah login | 5x per sesi |
| Setelah 5x gagal | Lockout sementara (cooldown) |
| Durasi cooldown | 5 menit (bisa dikonfigurasi) |
| Selama lockout | Form disabled + hitung mundur tampil |
| Setelah cooldown | Counter reset → bisa coba lagi |
| Login sukses | Counter ikut reset |

---

## 11. Milestones

### Phase 0 (Frontend Statis) — 🔵 SEDANG DIKERJAKAN
- Desain & SSOT UI dikumpulkan (`D:\DOCUMENT\Mina-UI-SSOT\`)
- **Frontend statis** (tanpa flow/backend): login PIN, dashboard shell + sidebar, contacts, follow-up, inbox, deals, tasks, automation, reports, logs, settings
- Semua halaman pake **data dummy/static** — belum nyambung DB
- Tujuan: Bang Handry lihat & setujui desain dulu, baru lanjut flow

### Phase 1 (MVP) — P0
- **Auth & Security**: halaman login + kebijakan 5x salah → lockout
- **WA Bridge di VPS**: service mandiri (Baileys) — QR login, session persist, REST /send, webhook event
- Contacts CRUD + auto-create dari chat masuk
- Inbox & Chat (terima + kirim)
- **⭐ Follow-up Engine dasar**: 1 sequence default (FU1/FU2/FU3), trigger kontak baru, stop-on-reply, safety engine

### Phase 2 — P1
- Sequence editor (tambah/edit step, template, interval, trigger)
- Follow-up progress dashboard + response rate
- Deals & Pipeline (kanban)
- Tasks & reminder
- Chatbot automation (keyword)

### Phase 3 — P2
- Broadcast aman
- Report & dashboard lengkap
- Export & backup otomatis

---

## 12. Open Questions (perlu jawaban Bang)

1. **Interval FU**: H+1 / H+3 / H+7 udah pas, atau mau beda? (misal H+1 / H+2 / H+4)
2. **Trigger**: kontak baru masuk aja, atau deal masuk stage tertentu juga?
3. **Kalau customer balas**: stop total (default), atau lanjut tapi template beda?
4. **Nomor WA**: dedicated baru atau nomor existing?
5. **Hosting**: localhost dulu atau VPS?
6. **Bahasa UI**: Indonesia atau English?

---

## 13. Acceptance Criteria (v1)

- [ ] Scan QR → connect → status connected
- [ ] Chat masuk dari WA muncul di inbox
- [ ] Balas dari dashboard → terkirim
- [ ] Kontak baru otomatis tersimpan dari chat masuk
- [ ] **Kontak baru → otomatis masuk sequence → FU1 terkirim H+1 (±20%)**
- [ ] **FU2 terkirim H+3, FU3 terkirim H+7 (kalo gak dibalas)**
- [ ] **Customer balas → sequence stop, status berubah**
- [ ] **Kirim cuma jam 08:00–20:00, gak ada pesan tengah malam**
- [ ] **Kontak yang unsubscribe gak di-FU lagi**
- [ ] Sequence editor jalan (edit interval & template)
- [ ] Progress dashboard nampilin status FU per kontak
- [ ] Restart app → session WA tetap connected, scheduler catch-up
- [ ] lint 0 error, build sukses
