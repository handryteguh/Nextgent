# Mina-UI 🛡️

**CRM + WhatsApp follow-up otomatis** — backend MVP pribadi Bang Handry.

> **Single-user · Self-hosted · Data 100% lokal.** Bukan SaaS. Fokus: nyelesaiin masalah follow-up customer yang kelewat.

## ⚡ Fitur Utama

| Fitur | Deskripsi | Status |
|---|---|---|
| ⭐ **Auto Follow-up FU1/FU2/FU3** | Follow-up otomatis H+1 / H+3 / H+7, **stop-on-reply** | 🔵 Phase 0 (UI statis) |
| 🛡️ **Safety Engine** | Jam kirim 08–20, delay random ±20%, unsubscribe-aware, warm-leads only | 🔵 Phase 0 (UI statis) |
| 📱 **WhatsApp Connect** | QR login (Baileys), session persist di VPS | 🔵 Phase 0 (UI statis) |
| 💬 **Inbox & Chat** | Semua percakapan WA dalam satu tempat | 🔵 Phase 0 (UI statis) |
| 🧑🤝🧑 **Contacts CRM** | Kelola kontak & leads, status follow-up | 🔵 Phase 0 (UI statis) |
| 📊 **Deals Pipeline** | Kanban 4 tahap, drag & drop | 🔵 Phase 0 (UI statis) |
| 🤖 **Automation** | Auto-reply keyword rules + jam kerja | 🔵 Phase 0 (UI statis) |
| 📈 **Reports** | Bar chart mingguan + follow-up funnel | 🔵 Phase 0 (UI statis) |
| 🔐 **Login Aman** | Master PIN 2 langkah + lockout 5x salah | 🔵 Phase 0 (UI statis) |

**Legend**: 🔵 Phase 0 (frontend statis) · 🟡 Phase 1 (MVP) · 🟢 Phase 2+ (lanjutan)

## 🏗️ Tech Stack

| Layer | Pilihan |
|---|---|
| Framework | **Next.js 16.3.0** (Turbopack, App Router) |
| UI | **React 19.2** · **Tailwind 4** (CSS tokens, dark theme) |
| Database | **SQLite + Drizzle ORM** *(belum aktif — Phase 0)* |
| WA Bridge | Service terpisah di **VPS `solusiadmin-core-vps`** *(belum dibuat)* |
| Arsitektur | **MVC-style**: Route = Controller, Service = Model, Component = View |

## 📁 Struktur (MVC-style, anti-spaghetty)

```
app/
├── (auth)/login/          # View: Login PIN (2 langkah)
├── (dashboard)/
│   ├── layout.tsx         # View shell: Sidebar + konten
│   ├── page.tsx           # Dashboard (KPI + charts)
│   ├── inbox/  contacts/  followup/  deals/  tasks/
│   ├── automation/  reports/  logs/  settings/
│   └── legacy/            # Halaman lama (Hermes overview test-bed)
├── api/                   # Controller (route handlers) — Phase 1+
├── globals.css            # Design tokens (dark theme)
components/
├── ui/                    # Primitives: Button, Card, Badge, DataTable...
├── layout/                # Sidebar, PageHeader
└── features/              # (Phase 1+)
lib/
├── db/                    # (Phase 1+ — SQLite + Drizzle)
├── services/              # (Phase 1+ — logika bisnis)
└── utils.ts               # cn(), format, timeAgo
docs/
├── PRD.md                 # Product Requirements Document v0.3
├── login-flow.html        # Diagram alur login (5x → lockout)
├── why-rest-webhook.html  # Diagram arsitektur WA Bridge
└── mvc-architecture.html  # Diagram MVC-style di Next.js
```

**Aturan emas** (biar gak jadi spaghetti):
1. **Route handler tipis** — cuma request → panggil service → balikin JSON
2. **Service pegang logika** — verifikasi PIN, engine follow-up, safety rules
3. **Komponen gak kenal DB** — cuma render data yang dikasih

## 🚀 Menjalankan

```bash
npm install
npm run dev        # http://localhost:3000
npm run lint       # eslint — target 0 error
npm run build      # production build — target sukses
```

**Login (Phase 0):** buka `/login`, masukkan PIN apa pun ≥ 4 digit (belum ada backend).

## 🗺️ Roadmap

| Fase | Isi | Status |
|---|---|---|
| **Phase 0** | Frontend statis (11 halaman, data dummy, dark theme Mina Forge) | ✅ Selesai |
| **Phase 1 (MVP)** | Auth + SQLite/Drizzle, WA Bridge di VPS, Contacts CRUD, Inbox real, Follow-up engine, Scheduler | ⬜ Belum |
| **Phase 2** | Deals CRUD, Automation rules, Reports real | ⬜ Belum |
| **Phase 3** | Broadcast aman, Chatbot CS AI (Hermes + MCP) | ⬜ Nanti |

## 📚 SSOT (Single Source of Truth)

| Lokasi | Isi |
|---|---|
| `D:\DOCUMENT\Mina-UI-SSOT\` | Style guide UI (dark + kuning), folder `design/` (referensi gambar) |
| `docs/PRD.md` | Product Requirements Document v0.3 |
| Repo ini | Kode sumber + diagram (`docs/*.html`) |

## 📝 Catatan

- **Bukan SaaS** — keputusan: konsep multi-tenant = red ocean, ditunda. Fokus backend pribadi.
- **WA Bridge terpisah** dari app (jalan 24/7 di VPS, komunikasi REST + Webhook). MCP disimpan buat fase CS bot AI nanti.
- **Kanal v1: WhatsApp only** (Telegram pernah dibahas, ditolak).
- **Data HJB = lane Devsandbox** — Nexgent tidak menyentuh data produksi; dashboard pakai sample anonim.

---

*Dibuat untuk Bang Handry · Next.js 16 · React 19 · Tailwind 4 · SQLite + Drizzle (rencana)*