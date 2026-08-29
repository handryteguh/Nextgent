# Mina-UI — WhatsApp CRM Dashboard DapurMina

Dashboard CRM berbasis Next.js untuk mengelola komunikasi WhatsApp bisnis DapurMina via WA Bridge mina-cs.

## Stack

- **Next.js 16.3.0** + React 19 + TypeScript
- **Tailwind CSS 4** — dark theme custom
- **SQLite** via better-sqlite3 + Drizzle ORM
- **WA Bridge VPS** — REST API di `43.157.212.210:3002`

## Fitur

| Halaman | Fitur |
|---------|-------|
| `/` Dashboard | WA Bridge status banner (uptime, queue, mem), KPI cards |
| `/inbox` | Real-time conversation list (poll 3s), chat history, send WA |
| `/contacts` | CRUD kontak, Sinkronisasi WA (649 kontak dari bridge), Send WA |
| `/logs` | Live WA bridge logs, filter level, auto-refresh 5s |
| `/followup` | Follow-up reminder (coming soon) |
| `/deals` | Pipeline deals (coming soon) |

## Arsitektur WA Bridge

```
Customer WA → nomor mina-cs (QR linked device)
                    ↓
             bridge.js (port 3000)
             filter: @s.whatsapp.net only
             append → wa-inbound.log (NDJSON)
                    ↓
             server.js (port 3002) REST API
                    ↓
             Mina-UI polling tiap 3 detik
             /api/wa/poll → simpan DB → display inbox
```

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Setup environment

Buat file `.env.local`:

```env
HERMES_VPS_URL=http://43.157.212.210:3002
HERMES_VPS_TOKEN=<token>
AUTH_PIN=<pin-login>
```

### 3. Init database

```bash
npm run db:push
```

### 4. Jalankan dev server

```bash
npm run dev
# → http://localhost:3001
```

## Auto-start Windows

File VBS sudah dibuat di `shell:startup\mina-ui-dev.vbs` — dev server otomatis jalan saat Windows boot (hapus `.next` cache dulu biar Turbopack fresh).

## API Routes

| Route | Method | Deskripsi |
|-------|--------|-----------|
| `/api/auth/login` | POST | Login dengan PIN |
| `/api/summary` | GET | KPI + WA bridge status |
| `/api/messages` | GET | List conversations |
| `/api/messages` | POST | Kirim pesan via WA bridge |
| `/api/messages/[phone]` | GET | History chat per nomor |
| `/api/contacts` | GET/POST | CRUD kontak |
| `/api/wa/status` | GET | Status WA bridge |
| `/api/wa/poll` | GET | Pull pesan baru dari VPS |
| `/api/wa/send` | POST | Kirim WA via bridge |
| `/api/wa/logs` | GET | Bridge logs |
| `/api/wa/contacts` | GET | Kontak dari WA bridge |

## Commit History

| Commit | Fitur |
|--------|-------|
| `dfa92ea` | Kirim WA dari Contacts & Inbox + dynamic banner |
| `f566831` | Poll pesan masuk WA dari VPS bridge |
| `495b717` | Fix route messages/[phone] 500 error |
| `cb659c0` | Real-time inbox poll 3s |
| `7d90a62` | Fix Next.js 16.3 stable — turbopack config |
| `0b8cf4b` | Fix filter phone non-628xxx di poll |
| `65489f7` | Log Viewer /logs — live bridge logs |
| `a5e180b` | Sinkronisasi Kontak WA — modal preview + bulk import |
| `c98c1c1` | Fix normalize VPS contacts response |
| `16588e3` | Fix import skip duplikat (409), summary baru vs di-skip |
| `fb585d8` | UX: rename Import WA → Sinkronisasi WA |
| `4808714` | Fix poll direction ikut dari VPS (out/in) |

## Catatan

- **Nomor mina-cs** = QR linked device (Skenario B) — pesan dari HP primary tidak lewat bridge
- **Inbox** = CS dashboard utama — semua reply customer dari sini, bukan dari HP langsung
- **Nama kontak** = null saat import, auto-enrich saat kontak kirim pesan masuk
- **Filter bridge** = hanya `@s.whatsapp.net` (skip `@lid`, `@g.us`, `@newsletter`, `@broadcast`)
