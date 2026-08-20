# PRD: Mina-UI — CRM + WhatsApp dengan Automatic Follow-up

**Versi**: v0.4.1 (Review Core Features + Open Questions Resolved)
**Tanggal**: 20 Agustus 2026
**Status**: 🔵 Draft — hasil review 9 menu core features + semua open questions terjawab, menunggu approval Bang Handry
**Owner**: Bang Handry
**Tech Stack**: Next.js 16.3.0 (Turbopack) · React 19.2 · Tailwind 4 · TypeScript · **SQLite + Drizzle ORM** · WhatsApp Bridge (Baileys, service terpisah di VPS) · Scheduler (in-process)

**Keputusan Arsitektur (v0.3+)**: WA Bridge = service mandiri yang jalan 24/7 di VPS `solusiadmin-core-vps`. Komunikasi dengan Mina-UI via **REST (kirim pesan) + Webhook (event masuk)**.

**Keputusan Arsitektur (v0.4)**: **QR lifecycle = tanggung jawab Bridge** (sudah jalan: Hermes WA Bridge Baileys di VPS). Mina-UI TIDAK bikin QR connect sendiri — cukup baca status bridge + konsumsi REST/Webhook.

**Positioning (v0.3)**: Mina-UI = **backend MVP pribadi Bang Handry** (single-user, self-hosted, data 100% lokal). **BUKAN SaaS multi-tenant.** Konsep "banyak pengguna masing-masing connect nomor WA mereka" = red ocean (Fonnte, Wablas dll) → **ditunda, bukan fokus**. Arsitektur bridge multi-number-ready tetap dijaga biar opsi ini gak tertutup kalau nanti mau dieksplor.

---

## 1. Ringkasan Eksekutif

Mina-UI adalah **CRM tools sederhana + WhatsApp chatbot (QR code, unofficial) dengan fitur flagship: Automatic Follow-up Sequence (FU1 → FU2 → FU3)**.

**Keputusan kanal (v1): WhatsApp ONLY.** Telegram sempat dipertimbangkan sebagai kanal CS 24/7 (lebih stabil & gratis), tapi customer Indonesia mayoritas di WhatsApp — jadi v1 fokus penuh ke WhatsApp. Arsitektur tetap dibuat channel-agnostic (ada layer abstraksi MessageService), biar nanti kalau mau tambah Telegram/Email tinggal nambah adapter tanpa rombak.

Pasar CRM+WA udah ramai (Fonnte, Wablas, dll), tapi mayoritas cuma **blast tools** — kirim pesan massal, sisanya manual. Mina-UI beda: fokus ke **sales cadence engine** — setiap lead yang masuk otomatis di-follow-up berkala dengan jeda manusiawi, sampai customer balas atau sequence selesai.

**Kenapa ini aman dari banned**: follow-up dikirim ke kontak yang **sudah pernah interaksi** (warm leads), bukan nomor random. Ini pola yang paling aman di WhatsApp unofficial.

**Perubahan besar v0.4**: Chatbot Automation di-upgrade dari keyword-template statis menjadi **AI agent (mina-cs, profile Hermes di VPS)** yang menjawab sesuai Rules & SOP. Koneksi Mina-UI ↔ mina-cs via MCP menjadi jalur inti v1 (bukan "nanti").

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
- G6: **AI CS (mina-cs) yang merespons chat sesuai SOP** — bukan keyword statis

### Non-Goals (v1)
- NG1: Multi-user / auth (v1 single-user, localhost)
- NG2: WA Business API resmi (beda scope & biaya)
- NG3: Mass blast marketing agresif (justru bahaya banned)
- NG4: Payment gateway integrasi
- NG5: Mobile native app
- NG6: Kanal selain WhatsApp (Telegram, Email, dll) — v1 WA only; layer abstraksi disiapkan buat masa depan
- NG7: **Chat grup** — v1 chat 1-on-1 dulu; grup masuk P2 (baca saja)
- NG8: Kirim media/dokumen dari dashboard — v1 preview saja; kirim gambar P2
- NG9: Recurring task — P2; v1 task manual cukup

---

## 4. User Stories

| ID | Role | Story | Prioritas |
|----|------|-------|-----------|
| US-1 | Owner | Saya mau connect WhatsApp via QR (di bridge yang sudah jalan di VPS) | P0 |
| US-2 | Owner | Saya mau simpan & kelola kontak customer (lead vs customer) | P0 |
| US-3 | Owner | Saya mau lihat semua chat WA masuk & keluar di satu inbox | P0 |
| US-4 | Owner | Saya mau balas chat dari dashboard tanpa buka HP | P0 |
| US-5 | Owner | **Saya mau setiap lead baru otomatis masuk sequence FU1→FU2→FU3** | **P0** |
| US-6 | Owner | Saya mau sequence berhenti otomatis kalau customer balas | P0 |
| US-7 | Owner | Saya mau edit template & interval tiap step FU | P1 |
| US-8 | Owner | Saya mau lihat progress FU tiap kontak (udah FU berapa, balas apa belum) | P1 |
| US-9 | Owner | Saya mau buat deal & kelola pipeline penjualan | P1 |
| US-10 | Owner | Saya mau task & reminder follow-up manual | P0 |
| US-11 | Owner | Saya mau laporan response rate per step FU + konversi ke deal | P1 |
| US-12 | Owner | Saya mau chatbot AI (mina-cs) menjawab chat sesuai SOP saat saya sibuk | P1 |

---

## 5. Fitur (Scope v1)

### 5.1 WhatsApp Connection — P0 (via Bridge)

**Keputusan v0.4: QR lifecycle = tanggung jawab Bridge, BUKAN Mina-UI.**

```
VPS solusiadmin-core-vps
┌──────────────────────────────────────────┐
│  HERMES WA BRIDGE (Baileys) [SUDAH JALAN] │
│  • QR generate & tampil di UI bridge      │
│  • Session persist (aman restart)         │
│  • Auto-relink QR saat session expired    │
└───────────────┬──────────────────────────┘
                │ REST /send · GET /status
                │ Webhook event masuk
                ▼
        MINA-UI (Next.js)
        • GAK bikin QR connect sendiri
        • Baca status bridge → tampilkan
        • Konsumen REST/Webhook
```

Mina-UI hanya perlu:
1. **Baca status bridge** (`GET /status`) → tampilkan di dashboard
2. **Status states**: `disconnected` (belum connect / sengaja logout) · `connecting` (socket handshake) · `connected` (siap kirim & terima) · `reconnecting` (socket putus, nyoba balik) · `logged_out` (session expired / di-revoke dari HP)
3. Kalau disconnected/logged_out → tampilkan instruksi: "Scan QR di Hermes/Bridge" + link ke UI bridge
4. **Logout** → minta bridge revoke session (Mina-UI tidak pegang session)
5. **Satu nomor WA aktif** di v1 (arsitektur multi-number ready)

**⚠️ Disconnect → PAUSE semua sequence aktif** (status `paused`, resume manual setelah reconnect). **Notifikasi: banner di dashboard** saat status berubah disconnected.

### 5.2 Contacts (CRM) — P0

- CRUD kontak: nama, nomor HP, email, tags, notes, source
- **Status kontak: `lead` (belum beli) / `customer` (udah beli)** — dipakai buat follow-up & deal
- Import kontak: manual / CSV
- **Auto-create kontak dari chat WA masuk**
- **Dedupe otomatis: nomor = unique key** (normalisasi E.164). Kontak yang sama → update, bukan bikin duplikat
- **Auto-create rule**: chat masuk → cek nomor di DB → ada? update `lastInteractionAt`; gak ada? create (source=wa, status=lead) + **otomatis masuk sequence FU** (default)
- Search & filter: by name, tag, date, status (lead/customer), source, FU status
- **Export CSV** (P1)
- **Bulk action**: pilih multiple → tambah tag, tambah ke sequence, export
- **Nama default**: chat dari nomor tanpa nama → `+62xxx`, user bisa edit

### 5.3 WhatsApp Inbox & Chat — P0

- Inbox: list percakapan 1-on-1, unread badge per kontak + total di sidebar, search (nama kontak + isi pesan — P1 full-text)
- Chat view: bubble UI, kirim teks, auto-scroll, tombol "jump to latest"
- Status pesan keluar: `pending` (jam) → `sent` (✓) → `delivered` (✓✓) → `read` (✓✓ biru); `failed` (ikon merah + tombol retry)
- **Auto-save semua chat ke DB** — history aman walau reconnect
- **Lampiran v1: preview gambar saja** (simpan di storage lokal `uploads/`); kirim gambar P2
- **Grup: skip di v1** (P2 baca saja)
- **Pesan dari kontak unsubscribe** → tetap masuk inbox (konsumen boleh chat), cuma gak di-FU lagi

**Alur teknis:**
```
TERIMA:  Bridge → Webhook POST /api/webhook/message
         → simpan ke DB (message baru)
         → update lastInteractionAt kontak
         → evaluasi "pesan ini balasan?" → kalau ya → stop sequence
         → unread count naik

KIRIM:   User ketik di chat view
         → POST /api/wa/send (Mina-UI)
         → Mina-UI panggil Bridge POST /send
         → status: pending → sent → delivered → read (via webhook status)
         → kalau gagal → status failed + retry manual
```

**Aturan "pesan masuk = balasan?" (krusial buat flagship):**
```
Pesan masuk → cek active run buat kontak itu
├─ Ada run aktif + pesan dari manusia (bukan status/broadcast)
│     → STOP sequence, status jadi "stopped_reply"
└─ Gak ada run / pesan cuma status (read receipt dll) / pesan di-auto-reply AI
      → gak ngapa-ngapain
```
Keputusan: **SEMUA pesan masuk dari kontak = balasan → stop** (simpel & aman, tanpa deteksi konteks).

### 5.4 ⭐ Automatic Follow-up Sequence (FLAGSHIP) — P0

**Inti produk. Lead masuk → otomatis di-FU sampai balas atau sequence selesai.**

#### 5.4.1 Konsep
- **Sequence** = rangkaian step follow-up dengan jeda tertentu
- Setiap **step** = {nama, delay, template pesan}
- Kontak yang trigger masuk sequence → tiap step terkirim otomatis sesuai jadwal

#### 5.4.2 Default sequence (bisa diedit)
| Step | Jeda (dari step sebelumnya TERKIRIM) | Template (default) |
|------|------|--------------------|
| FU1 | 24 jam (H+1) dari masuk sequence | "Halo {nama}, makasih udah hubungi kami. Ada yang bisa kami bantu soal {topik}?" |
| FU2 | 72 jam (H+3) dari FU1 terkirim | "Halo {nama}, follow-up nih — gimana {topik}? Kami bisa bantu kalau masih butuh." |
| FU3 | 168 jam (H+7) dari FU2 terkirim | "Halo {nama}, ini follow-up terakhir dari kami soal {topik}. Kabarin aja kalau masih minat ya." |

**Keputusan v0.4: Delay dihitung dari step SEBELUMNYA terkirim** (bukan dari kontak masuk) — natural & manusiawi: FU2 = 3 hari setelah FU1 terkirim, dst.

**Keputusan v0.4.1: Variabel `{topik}` diisi MANUAL saat tambah/edit kontak** (field `topic` di kontak). User yang tahu konteks percakapan mengisi topiknya — akurat, bukan tebakan. Kalau kosong, template tetap terkirim tanpa menyebut topik (fallback string kosong).

#### 5.4.3 Waktu & Timezone (PENTING)
- **Timezone DIKUNCI: WIB (Asia/Jakarta, UTC+7)** — jam kirim 08:00–20:00 WIB. Bukan UTC server, bukan timezone browser.
- **Aturan jadwal kirim:**
```
Step due → hitung jadwal kirim:
  Kalau jam due masih dalam 08:00–20:00 WIB → kirim sekarang
  Kalau lewat 20:00 → ditunda ke 08:00 besok
  Kalau sebelum 08:00 → tunggu 08:00 hari itu
Plus delay random ±20% (tapi tetap di dalam window kirim)
```
- **Max 1 pesan FU per kontak per hari** — dihitung dari kalendar WIB (bukan 24 jam rolling)

#### 5.4.4 Trigger (kapan kontak masuk sequence)
- ✅ Kontak baru masuk (auto-create dari chat WA, status lead) — default
- ✅ Deal masuk stage **Negotiation** → otomatis tambah kontak ke sequence (jika belum)
- ✅ Manual: tambah kontak ke sequence dari halaman kontak

#### 5.4.5 Stop rules (otomatis)
- 🛑 **Customer balas (pesan masuk dari manusia)** → sequence berhenti (`stopped_reply`)
- 🛑 Customer kirim kata berhenti ("stop", "berhenti", "jangan") → **unsubscribe permanen** (`stopped_unsub`)
- 🛑 Deal won/lost → sequence berhenti (`stopped_deal`)
- 🛑 **Bridge disconnect** → semua sequence PAUSE (`paused`, resume manual)
- 🛑 Manual: user hentikan / skip / tunda dari dashboard

#### 5.4.6 Status run (lengkap)
```
active           → lagi jalan, nunggu step berikutnya
waiting_schedule → due tapi nunggu jam kirim valid (luar 08-20)
paused           → WA disconnect (resume manual)
stopped_reply    → customer balas
stopped_unsub    → minta berhenti
stopped_deal     → deal won/lost
completed        → semua step terkirim
failed           → kirim gagal (setelah retry habis)
cancelled        → manual / dihapus
```

#### 5.4.7 Retry policy (v0.4)
```
Kirim gagal → retry 3x (interval 10 menit, 30 menit, 1 jam)
Setelah itu → status failed, muncul di dashboard buat review manual
Step berikutnya: tetap jalan sesuai jadwal (gak nunggu failed)
```

#### 5.4.8 Manual control (v0.4)
```
Dari halaman kontak / progress dashboard:
  Tombol "Lewati step ini" → lanjut step berikutnya
  Tombol "Hentikan sequence" → status cancelled
  Tombol "Tunda" → pilih kapan lanjut
```

#### 5.4.9 Safety engine (anti-banned)
- ⏰ Kirim hanya jam **08:00–20:00 WIB** (di luar jam → ditunda ke jam berikutnya)
- 🎲 **Delay random ±20%** (H+1 jadi 20–28 jam) — gak keliatan bot
- 📩 **Max 1 pesan FU per kontak per hari**
- ✅ **Hanya ke kontak warm** (pernah interaksi) — default on, gak bisa blast ke nomor acak
- 📵 **Unsubscribe list** — kontak yang minta berhenti gak akan di-FU lagi
- 🛡️ **Semua kirim lewat Safety Engine — gak ada bypass**

#### 5.4.10 Dashboard progress
- List kontak dalam sequence: status (Menunggu FU1 / FU1 terkirim / FU2 terkirim / FU3 terkirim / Balas / Selesai)
- Klik kontak → lihat riwayat FU + balasan customer
- **Metric: response rate per step** (berapa % kontak balas setelah FU1, FU2, FU3)

### 5.5 Deals & Pipeline — P1

- **Default pipeline (configurable): New → Contacted → Qualified → Proposal → Negotiation → Won/Lost**
- **Won/Lost = status OBJECT terpisah** (`open` / `won` / `lost`), bukan stage — stage cuma posisi
- Kanban board: drag & drop deal antar stage
- Field deal: `title, value (IDR default), stage, contactId (WAJIB), expectedClose, wonAt, lostReason, notes (activity feed), owner (opsional)`
- **Integrasi sequence**: masuk stage **Negotiation** → otomatis trigger sequence untuk kontak terkait (jika belum ada run); deal **Won/Lost** → stop sequence aktif
- **Report data**: pipeline value by stage (funnel), win rate = won/(won+lost), revenue forecast = sum(value × probabilitas stage)

### 5.6 Tasks & Follow-up Manual — P0

- **Positioning**: Sequence otomatis = follow-up terjadwal & berulang; Task manual = tindakan di luar sequence (telpon, cek proposal, kirim dokumen, internal)
- Field: `title, description?, type (call|whatsapp|email|internal), priority (low|medium|high), status (pending|in_progress|done|cancelled), dueAt (tanggal+jam), contactId? (opsional), dealId? (opsional), createdAt, completedAt`
- **Reminder: badge di sidebar + notifikasi banner** — jumlah task pending due hari ini / overdue
- Halaman Tasks: filter pills (Semua / Hari ini / Overdue / Done)
- Integrasi: tombol "Buka chat" (ke chat kontak terkait), "Buka deal" (ke detail deal), "Kirim WA" (compose di inbox kalau type=whatsapp & ada contactId)
- Recurring task: **P2** (v1 manual cukup)

### 5.7 Chatbot Automation — AI-assisted CS (mina-cs) — P1

**Perubahan besar v0.4: dari keyword-template statis → AI agent (mina-cs).**

#### 5.7.1 Konsep
- **Otak auto-reply = `mina-cs`** (profile Hermes di VPS `solusiadmin-core-vps`) yang menjawab sesuai **Rules & SOP** yang sudah di-set
- Alur: WA masuk → webhook → Mina-UI simpan → **forward ke mina-cs (via MCP)** → mina-cs jawab sesuai SOP → balas via bridge
- **MCP jadi jalur inti v1** (bukan "nanti") — Hermes mina-cs = konsumen kedua bridge

```
Pesan WA masuk → Bridge → Webhook → Mina-UI
                                        │
                           (simpan + update kontak)
                                        │
                         forward ke mina-cs (MCP)
                                        │
                          mina-cs jawab sesuai Rules/SOP
                                        │
                        balas via Bridge (POST /send)
```

#### 5.7.2 Aturan
- **Auto-reply TIDAK menghentikan sequence** — sequence tetap jalan sesuai jadwal. Hanya pesan dari manusia yang TIDAK di-auto-reply yang menghentikan sequence. Auto-reply = bot yang balas, bukan manusia yang engage.
- **Fallback (pesan gak match rule/skill manapun)**: ikut Rules & SOP profile mina-cs
- **Cooldown 30 menit per kontak** — setelah auto-reply ke kontak, pesan masuk berikutnya dalam 30 menit TIDAK di-auto-reply lagi (diam, biar manusia yang handle) — anti-spam & anti-loop
- Keyword rules (template statis) bisa tetap ada sebagai fast-path opsional, tapi intelijen utama = AI mina-cs
- **Log semua percakapan AI di DB** — buat review & training/perbaikan SOP
- **Business hours** (opsional): AI bisa nonaktif di luar jam → fallback ke manusia

### 5.8 Broadcast (Aman) — P2

- **Definisi tegas:**
```
BROADCAST = kirim pesan SAMA ke banyak kontak, SATU KALI (promo, pengumuman)
SEQUENCE  = follow-up TERJADWAL, pesan BEDA per step, per kontak
```
- **Kapasitas aman (default, configurable):**
```
Max 10 kontak per batch (konservatif — sesuai preferensi Bang: dikit aja biar aman)
Jeda antar pesan: 30-60 detik (random)
Max 5 batch per hari
Max 50 kontak per hari
Semua bisa diubah di setting, dengan warning kalau naik = risiko banned
```
- **Kriteria eligible (wajib semua):**
```
✓ Pernah interaksi minimal 1x (chat masuk/keluar)
✓ Bukan unsubscribe
✓ Bukan kontak yang sedang dalam active sequence (biar gak dobel)
✓ Dalam jam kirim 08:00–20:00 WIB
```
- **Exclusion list**: unsubscribe + kontak yang belum pernah interaksi = GAK boleh di-blast
- **Draft & schedule**: draft tersimpan → jadwalin → jalan otomatis (pakai scheduler yang sama)
- **Report per broadcast**: total, terkirim, gagal (+alasan), dibalas
- **Konfirmasi**: broadcast >10 kontak → warning estimasi waktu + konfirmasi
- **Catatan**: broadcast BUKAN fitur utama — follow-up sequence yang utama

### 5.9 Report & Dashboard — P1

#### 5.9.1 Layout: Dashboard home + halaman Reports terpisah

#### 5.9.2 Dashboard home (KPI cards)
```
  Kontak total (+ pertumbuhan minggu ini)
  Chat hari ini (masuk/keluar)
  Follow-up aktif (dalam sequence)
  Response rate (rata-rata semua sequence)
  Deal aktif + total nilai
  Task overdue hari ini
```

#### 5.9.3 Reports (fokus utama: response rate & konversi)
- **Follow-up funnel bertingkat:**
```
Level 1: Kontak masuk sequence
Level 2: Balas setelah FU1
Level 3: Balas setelah FU2
Level 4: Balas setelah FU3
Level 5: Konversi jadi deal (Won)
```
- **Response rate per step** (FU1 30%, FU2 20%, FU3 10%) — buat optimasi template & timing
- **Konversi sequence → deal** — revenue yang dihasilkan dari follow-up
- **Health indicator**: WA status (connected/disconnected), kirim gagal (total + per hari — naik = tanda bahaya), unsubscribe (total + per minggu — naik = pesan terlalu agresif)
- **Chart**: chat per hari, kontak baru per minggu, deal won/lost per bulan
- **Range waktu global**: Hari ini / 7 hari / 30 hari / Custom — semua chart & KPI ikut
- **Actionable insight**: "12 kontak nunggu FU2 — cek template", "3 kirim gagal — verifikasi nomor", "5 deal di Negotiation — follow-up minggu ini"
- **Export report** (CSV/PDF) — P2

---

## 6. Arsitektur

```
┌─────────────────────────────────────────────────┐
│              Browser (Next.js UI)                │
│  /  /contacts  /inbox  /chat/[id]  /deals       │
│  /tasks  /automation  /followup  /reports       │
│  /settings/wa (status bridge)                   │
└──────────────────────┬──────────────────────────┘
                       │ fetch (REST, polling)
┌──────────────────────▼──────────────────────────┐
│            Next.js API Routes                   │
│  /api/wa/status · /api/wa/send · /api/messages  │
│  /api/webhook/* (dari bridge)                   │
│  /api/contacts · /api/deals · /api/tasks        │
│  /api/automation · /api/broadcast               │
│  /api/followup/sequences · /api/followup/run    │
│  /api/cs/* (forward ke mina-cs via MCP)         │
└──────────────────────┬──────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────┐
│            Mina-UI Core Services (Node)         │
│  ┌─────────────┐  ┌──────────────────────────┐  │
│  │ WA Client   │  │ Follow-up Scheduler      │  │
│  │ (REST ke    │  │ tick tiap menit:         │  │
│  │  bridge)    │  │ cek step yang jatuh      │  │
│  └─────────────┘  │ tempo → safety check →   │  │
│  ┌─────────────┐  │ kirim → update status    │  │
│  │ AI CS Client│  └──────────────────────────┘  │
│  │ (MCP ke     │  ┌──────────────────────────┐  │
│  │  mina-cs)   │  │ Safety Engine            │  │
│  └─────────────┘  │ jam kirim, delay, cap,   │  │
│                   │ unsubscribe — no bypass  │  │
│                   └──────────────────────────┘  │
│  ┌───────────────────────────────────────────┐  │
│  │ SQLite (Drizzle ORM)                      │  │
│  │ contacts · messages · deals · tasks       │  │
│  │ sequences · steps · runs · unsubscribes   │  │
│  │ ai_conversations (log AI CS)              │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### Komponen kunci
- **WA Client**: REST client ke bridge — status, kirim, logout. Gak pegang session.
- **Follow-up Scheduler**: loop tiap menit → cari step yang `due_at <= now` → safety check → kirim via bridge → update status
- **Safety Engine**: validasi jam kirim (08-20 WIB), delay random ±20%, max per hari, unsubscribe check — **semua kirim lewat sini, gak ada bypass**
- **AI CS Client**: koneksi MCP ke mina-cs — forward pesan, terima jawaban, log percakapan
- **DB**: SQLite (file-based) — simpel, backup = copy file

### Arsitektur WA Bridge (v0.3+)

```
VPS solusiadmin-core-vps (WA harus hidup 24/7)
┌──────────────────────────────────────────┐
│  WA BRIDGE (service mandiri, Baileys)     │
│  • QR connect — scan sekali (udah jalan)  │
│  • Session persist (aman restart)         │
│  • REST API: POST /send, GET /status      │
│  • Webhook keluar → event ke Mina-UI      │
└───────────────┬──────────────────────────┘
                │ pesan masuk / status kirim (Webhook)
                ▼
        MINA-UI (Next.js + SQLite)
        • REST client → bridge (kirim pesan)
        • Webhook handler → simpan + trigger FU engine

        MINA-CS (Hermes profile di VPS) — via MCP
        • Baca chat/konteks, balas sesuai SOP
        • Konsumen kedua dari bridge (satu bridge, banyak konsumen)
```

**Alur komunikasi:**
1. **Kirim pesan** (balas chat / follow-up) → Mina-UI panggil `POST /send` di bridge
2. **Pesan masuk** → bridge kirim webhook ke Mina-UI → simpan ke DB + trigger follow-up engine + (jika perlu) forward ke mina-cs
3. **QR connect** → di UI bridge (Hermes di VPS) — scan sekali → session tersimpan di VPS
4. **AI CS** → Mina-UI forward pesan ke mina-cs via MCP → jawaban dikirim via bridge

**Kenapa REST + Webhook (bukan MCP untuk jalur pesan):**
- MCP = protokol untuk agent AI manggil tools (Hermes → bridge sebagai CS bot). Bukan protokol real-time chat.
- REST + Webhook = pola standar, ringan, mudah di-debug, semua bahasa dukung.
- Bridge terpisah → restart app/deploy gak matiin koneksi WA.
- Bridge satu → banyak konsumen (Mina-UI, mina-cs, dll).

**MCP dipakai di v1 untuk jalur AI CS** (Mina-UI → mina-cs) — ini keputusan v0.4.

---

## 7. Data Model (ringkas)

```ts
// Contact
interface Contact {
  id: string;
  name: string;
  phone: string;          // E.164, UNIQUE (dedupe key)
  email?: string;
  tags: string[];
  notes?: string;
  source: "manual" | "wa" | "import";
  status: "lead" | "customer";      // v0.4
  topic?: string;                   // v0.4.1 — variabel {topik} di template FU
  lastInteractionAt?: string;       // v0.4 — update setiap ada chat
  createdAt: string;
  updatedAt: string;
}

// Message
interface Message {
  id: string;
  contactId: string;
  direction: "in" | "out";
  type: "text" | "image";
  body: string;
  waMessageId: string;
  status: "pending" | "sent" | "delivered" | "read" | "failed";
  fromAi: boolean;        // v0.4 — pesan dari auto-reply AI
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
  delayHours: number;      // 24, 72, 168 — dari step sebelumnya TERKIRIM
  template: string;        // "Halo {nama}, ..."
  order: number;
}

// Run = instance sequence untuk 1 kontak
interface FollowUpRun {
  id: string;
  contactId: string;
  sequenceId: string;
  status: "active" | "waiting_schedule" | "paused" | "stopped_reply"
        | "stopped_unsub" | "stopped_deal" | "completed" | "failed" | "cancelled";
  currentStep: number;     // 0 = belum FU1
  nextDueAt: string | null;
  lastSentAt: string | null;
  startedAt: string;
}

// Deal
interface Deal {
  id: string;
  title: string;
  value: number;           // IDR default
  status: "open" | "won" | "lost";   // v0.4 — terpisah dari stage
  stage: string;           // New | Contacted | Qualified | Proposal | Negotiation
  contactId: string;       // WAJIB
  expectedClose?: string;
  wonAt?: string;
  lostReason?: string;     // harga/kompetitor/tunda/dll
  notes?: string;          // activity feed
}

// Task
interface Task {
  id: string;
  title: string;
  description?: string;
  type: "call" | "whatsapp" | "email" | "internal";
  priority: "low" | "medium" | "high";
  status: "pending" | "in_progress" | "done" | "cancelled";
  dueAt: string;           // tanggal + jam
  contactId?: string;
  dealId?: string;
  createdAt: string;
  completedAt?: string;
}

// AutomationRule (optional fast-path, intelijen utama = AI mina-cs)
interface AutomationRule {
  id: string;
  keyword: string;
  reply: string;
  matchType: "exact" | "contains" | "regex";
  priority: number;
  enabled: boolean;
}

// AI CS log (v0.4)
interface AiConversation {
  id: string;
  contactId: string;
  messageId: string;
  request: string;        // pesan yang diforward
  response: string;       // jawaban mina-cs
  createdAt: string;
}

// Unsubscribe
interface Unsubscribe {
  phone: string;           // gak akan di-FU / di-blast lagi
  reason: "user_request" | "auto";
  createdAt: string;
}

// Broadcast (P2)
interface Broadcast {
  id: string;
  message: string;
  status: "draft" | "scheduled" | "running" | "done" | "cancelled";
  scheduledAt?: string;
  batchSize: number;       // default 10
  totals: { sent: number; failed: number; replied: number };
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
| Dashboard | `/` | KPI cards (5-6), line chart, donut chart |
| Contacts | `/contacts` | Search + filter pills, tabel (nama, WA, status lead/customer, status FU, aksi) |
| Follow-up | `/followup` | Stats row, form sequence editor + tabel progress |
| Inbox | `/inbox` | 2 kolom: list chat + conversation (kayak WA Web) |
| Deals | `/deals` | Kanban drag & drop |
| Tasks | `/tasks` | Tabel task + filter (Semua/Hari ini/Overdue/Done) + badge sidebar |
| Automation | `/automation` | Status AI CS (mina-cs), cooldown, log percakapan, rules opsional |
| Reports | `/reports` | Funnel FU, response rate per step, health indicator, chart |
| Logs | `/logs` | Filter pills, tabel (waktu, aksi, detail, status, IP) |
| Pengaturan | `/settings` | Form settings + status koneksi WA (dari bridge) |

### 8.5 Halaman Login (2 Langkah)
- **Langkah 1 — Master PIN**: input PIN → verifikasi
- **Langkah 2**: verifikasi lanjutan (sesuai desain)
- Menampilkan sisa percobaan ("Percobaan ke-2/5")
- Saat lockout: form disabled + hitung mundur

---

## 9. Risiko & Mitigasi

| Risiko | Level | Mitigasi |
|--------|-------|----------|
| WA banned | 🔴 Tinggi | Warm-leads only, rate limit, delay random, jam kirim WIB, unsubscribe, dedicated number, broadcast konservatif (10/batch) |
| Library deprecated | 🟡 Sedang | Baileys aktif di-maintain, backup session, monitor update |
| Data hilang | 🟡 Sedang | Auto-backup SQLite, export CSV |
| Scheduler miss (app mati) | 🟡 Sedang | Due check saat startup → kirim yang terlewat (catch-up) |
| AI CS jawab salah / di luar SOP | 🟡 Sedang | Rules & SOP di profile mina-cs, log semua percakapan untuk review, cooldown anti-loop, batas otoritas (gak boleh transaksi tanpa approval) |
| QR expired | 🟢 Rendah | Auto-refresh QR di bridge, notifikasi UI |
| Disconnect tengah malam | 🟢 Rendah | Banner dashboard + pause sequence (no silent miss) |
| AI CS akses data CRM | 🟡 Sedang | **Read-only** ke kontak & deal (personalisasi jawaban), **tidak bisa edit**; semua akses di-log |

---

## 10. Non-Functional Requirements

| Aspek | Requirement |
|-------|-------------|
| Performance | API < 2s; chat load < 1s |
| Reliability | Gateway restart → auto-reconnect; scheduler catch-up setelah mati |
| Security | Auth: login 5x salah → lockout (cooldown 5 menit, hitung mundur, counter reset); v1: bind localhost only; session WA di VPS (bridge) |
| Testing | lint 0 error; build sukses; smoke test tiap API |
| Data | SQLite auto-backup harian |
| Backup eksternal | v1: backup lokal (copy file SQLite) + export CSV manual. Google Drive/Dropbox otomatis = **P2** |

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

### Phase 0 (Frontend Statis) — SEDANG DIKERJAKAN
- Desain & SSOT UI dikumpulkan (`D:\DOCUMENT\Mina-UI-SSOT\`)
- **Frontend statis** (tanpa flow/backend): login PIN, dashboard shell + sidebar, contacts, follow-up, inbox, deals, tasks, automation, reports, logs, settings
- Semua halaman pake **data dummy/static** — belum nyambung DB
- Tujuan: Bang Handry lihat & setujui desain dulu, baru lanjut flow

### Phase 1 (MVP) — P0
- **Auth & Security**: halaman login + kebijakan 5x salah → lockout
- **WA Bridge di VPS**: integrasi dengan bridge yang SUDAH JALAN — baca status, REST /send, webhook handler; QR tetap di bridge (tidak bikin ulang)
- **Kebijakan disconnect**: WA status berubah → pause semua sequence + banner dashboard
- Contacts CRUD + auto-create dari chat masuk + dedupe nomor + lead/customer
- Inbox & Chat (terima + kirim, status pesan lengkap)
- **⭐ Follow-up Engine dasar**: 1 sequence default (FU1/FU2/FU3), trigger kontak baru, stop-on-reply (semua pesan masuk = balasan), safety engine (jam WIB, delay ±20%, cap harian, unsubscribe), retry 3x, manual skip/pause
- **Tasks**: CRUD + badge sidebar + filter

### Phase 2 — P1
- Sequence editor (tambah/edit step, template, interval, trigger)
- Follow-up progress dashboard + response rate per step
- Deals & Pipeline (kanban, 6 stage, won/lost object)
- **Chatbot AI (mina-cs)**: koneksi MCP, forward pesan, jawaban sesuai SOP, cooldown 30m, log percakapan
- Reports: funnel FU, response rate, konversi ke deal, health indicator

### Phase 3 — P2
- Broadcast aman (10/batch, schedule, report, exclusion)
- Export & backup otomatis
- Recurring task
- Chat grup (baca saja)
- Kirim media dari dashboard

---

## 12. Open Questions (perlu jawaban Bang)

1. ~~Interval FU: H+1 / H+3 / H+7 udah pas?~~ → **DIPUTUSKAN (v0.4)**: H+1 / H+3 / H+7, delay dihitung dari step sebelumnya terkirim. Bisa edit di sequence editor.
2. ~~Trigger: kontak baru / deal stage?~~ → **DIPUTUSKAN (v0.4)**: kontak baru (lead) OTOMATIS; deal masuk Negotiation OTOMATIS; manual kapan aja.
3. ~~Kalau customer balas: stop total?~~ → **DIPUTUSKAN (v0.4)**: stop total (`stopped_reply`). Semua pesan masuk dari manusia = balasan.
4. ~~Nomor WA dedicated atau existing?~~ → **DIPUTUSKAN (v0.4)**: nomor yang SUDAH terhubung di bridge (VPS) — sama, tinggal integrasi.
5. ~~Hosting: localhost dulu atau VPS?~~ → **DIPUTUSKAN (v0.3+)**: backend di VPS (WA harus 24/7); UI bisa diakses dari mana aja.
6. ~~Bahasa UI: Indonesia atau English?~~ → **DIPUTUSKAN (v0.3)**: Bahasa Indonesia.
7. ~~Broadcast capacity?~~ → **DIPUTUSKAN (v0.4)**: 10/batch default, setting anti-banned, max 50/hari (conservative).
8. ~~Auto-reply: keyword statis atau AI?~~ → **DIPUTUSKAN (v0.4)**: AI (mina-cs) sesuai SOP, keyword rules opsional fast-path.
9. ~~Export/backup otomatis ke mana?~~ → **DIPUTUSKAN (v0.4.1)**: Lokal (copy file) + CSV manual di v1; Google Drive/Dropbox otomatis = P2.
10. ~~Variabel {topik} di template FU diisi dari mana?~~ → **DIPUTUSKAN (v0.4.1)**: Manual saat tambah/edit kontak (field `topic`). Kosong = template tanpa topik.
11. ~~AI CS boleh akses data kontak/deal?~~ → **DIPUTUSKAN (v0.4.1)**: **Read-only** ke kontak & deal (personalisasi jawaban), **tidak boleh edit**; semua akses di-log.

**Semua open questions v0.3 → RESOLVED. Tidak ada open questions tersisa.**

---

## 13. Acceptance Criteria (v1)

- [ ] Integrasi bridge: status connected tampil di dashboard, QR tetap di bridge (tidak ada halaman QR di Mina-UI)
- [ ] **WA disconnect → semua sequence pause + banner muncul**
- [ ] Chat masuk dari WA muncul di inbox
- [ ] Balas dari dashboard → terkirim (status pending→sent→delivered→read)
- [ ] Kontak baru otomatis tersimpan dari chat masuk (gak ada duplikat nomor)
- [ ] **Kontak baru (lead) → otomatis masuk sequence → FU1 terkirim H+1 (±20%)**
- [ ] **FU2 terkirim H+3 setelah FU1 terkirim, FU3 terkirim H+7 setelah FU2 terkirim (kalo gak dibalas)**
- [ ] **Customer balas → sequence stop, status `stopped_reply`**
- [ ] **Kirim cuma jam 08:00–20:00 WIB, gak ada pesan tengah malam**
- [ ] **Kirim gagal → retry 3x (10m/30m/1j) → status failed**
- [ ] **Kontak yang unsubscribe gak di-FU lagi**
- [ ] Sequence editor jalan (edit interval & template)
- [ ] Deal masuk Negotiation → otomatis trigger sequence; Won/Lost → stop
- [ ] Task muncul di badge sidebar + filter hari ini/overdue
- [ ] AI CS (mina-cs) balas pesan sesuai SOP, cooldown 30 menit, percakapan ke-log
- [ ] Reports nampilin response rate per step + funnel + health indicator
- [ ] Restart app → session WA tetap connected (di bridge), scheduler catch-up
- [ ] lint 0 error, build sukses