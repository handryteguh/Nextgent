# Mina-UI — WhatsApp CRM Dashboard

Dashboard CRM berbasis WhatsApp untuk DapurMina. Dibangun dengan Next.js App Router, SQLite, dan Tailwind CSS. Jalan dari **lokal** — bukan VPS.

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16.3 (Turbopack) + React 19 |
| Styling | Tailwind CSS 4 |
| Database | SQLite + Drizzle ORM (better-sqlite3) |
| Auth | PIN login (scrypt hash) + HMAC session cookie |
| WA Bridge | Hermes Agent `mina-cs` di VPS via TailScale |

## Cara Jalankan

```bash
# Install dependencies
npm install

# Jalankan dev server (bind ke semua interface untuk akses TailScale)
npm run dev
# → http://localhost:3001
# → http://100.119.12.45:3001 (dari HP via TailScale)
```

## Akses dari HP

Pastikan TailScale aktif di laptop + HP dengan akun yang sama, lalu buka:
```
http://100.119.12.45:3001
```

Allow firewall Windows (jalankan PowerShell as Admin):
```powershell
netsh advfirewall firewall add rule name="Mina-UI-3001" dir=in action=allow protocol=TCP localport=3001
```

## Login

PIN default: `1234`

## Environment Variables

Buat file `.env.local` di root project:

```env
# Session
SESSION_SECRET=your-random-secret-here

# WhatsApp Bridge (Hermes Agent mina-cs di VPS via TailScale)
HERMES_VPS_URL=http://100.119.12.45:3002
HERMES_VPS_TOKEN=your-hermes-token

# Webhook secret (untuk validasi payload dari Hermes VPS)
WEBHOOK_SECRET=your-webhook-secret

# API secret (internal)
API_SECRET_KEY=your-api-secret
```

## Database

SQLite di `data/mina-ui.db`. Migrate dengan:

```bash
node db/migrate.js
```

## Fitur

| Halaman | Fitur |
|---|---|
| Dashboard | KPI cards, WA status, summary |
| Contacts | CRUD kontak, import CSV |
| Follow-up | Sequence FU1→FU2→FU3 otomatis |
| Tasks | Task management |
| Deals | Pipeline deals |
| Inbox | Pesan WA masuk |
| Automation | Keyword rules + AI CS log |
| Reports | Laporan aktivitas |
| Logs | Activity log |
| Settings | Follow-up delay, TailScale config, ganti PIN |

## Arsitektur WA Bridge

```
Customer WA
    ↓
Hermes Agent mina-cs (VPS, CS bot 24jam)
    ↓ webhook
Mina-UI /api/webhook/wa (lokal, via TailScale)
    ↓
SQLite DB → auto follow-up scheduler
```

## Scripts

```bash
npm run dev      # dev server port 3001
npm run build    # production build
npm run lint     # ESLint check
```

## Commit History

| Commit | Fitur |
|---|---|
| `8b08886` | Automation: keyword rules + AI log + Hermes bridge |
| `65049e2` | Logs: activity_logs DB + API + UI |
| `69f815e` | Settings: TailScale card + IP/port config |
| `cdb1d1a` | Dev server bind 0.0.0.0:3001 |
| `ccd208b` | Fix: tailscale_ip + tailscale_port ke ALLOWED_KEYS |
| `020b787` | Fix: login + TailScale settings auto-load |
| `2b390ac` | Fix: login redirect setTimeout |
| `730a7a2` | Settings: tombol Test Koneksi WA Bridge |
