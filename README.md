# Mina-UI 🛡️

**CRM + WhatsApp follow-up otomatis** — backend MVP pribadi Bang Handry.

> **Single-user · Self-hosted · Data 100% lokal.** Bukan SaaS. Fokus: nyelesaiin masalah follow-up customer yang kelewat.

## ⚡ Fitur Utama

| Fitur | Deskripsi | Status |
|---|---|---|
| ⭐ **Auto Follow-up FU1/FU2/FU3** | Follow-up otomatis H+1 / H+3 / H+7, **stop-on-reply**, delay dihitung dari step sebelumnya terkirim | 🔵 Phase 0 (UI statis) |
| 🛡️ **Safety Engine** | Jam kirim 08–20 **WIB**, delay random ±20%, max 1 pesan/hari/kontak, unsubscribe-aware, warm-leads only — **no bypass** | 🔵 Phase 0 (UI statis) |
| 📱 **WhatsApp Connect** | QR lifecycle = **Bridge di VPS** (sudah jalan: Hermes WA Bridge Baileys). Mina-UI cuma baca status + konsumsi REST/Webhook | 🔵 Phase 0 (UI statis) |
| 💬 **Inbox & Chat** | Semua percakapan WA 1-on-1 dalam satu tempat, status pesan lengkap (pending→sent→delivered→read→failed), semua pesan masuk = balasan → stop sequence | 🔵 Phase 0 (UI statis) |
| 🧑🤝🧑 **Contacts CRM** | Lead vs Customer, **dedupe otomatis** (nomor = unique key), lead baru dari chat → auto masuk sequence, field `topic` untuk template FU | 🔵 Phase 0 (UI statis) |
| 💼 **Deals Pipeline** | Kanban 6 tahap (New→Contacted→Qualified→Proposal→Negotiation→Won/Lost), Won/Lost = object status, masuk Negotiation → trigger sequence | 🔵 Phase 0 (UI statis) |
| ✅ **Tasks & Reminder** | Task ke kontak/deal, badge sidebar + notifikasi banner, filter Hari ini/Overdue | 🔵 Phase 0 (UI statis) |
| 🤖 **AI CS (mina-cs)** | Chat dibalas **AI agent (Hermes di VPS)** sesuai Rules & SOP, cooldown 30 menit anti-spam, koneksi via **MCP di v1** | 🔵 Phase 0 (UI statis) |
| 📈 **Reports** | Follow-up funnel, **response rate per step (FU1/FU2/FU3)**, konversi sequence→deal, health indicator WA | 🔵 Phase 0 (UI statis) |
| 🔐 **Login Aman** | Master PIN 2 langkah + lockout 5x salah (cooldown 5 menit) | 🔵 Phase 0 (UI statis) |

**Legend**: 🔵 Phase 0 (frontend statis) · 🟡 Phase 1 (MVP) · 🟢 Phase 2+ (lanjutan)

## 🏗️ Tech Stack

| Layer | Pilihan |
|---|---|
| Framework | **Next.js 16.3.0** (Turbopack, App Router) |
| UI | **React 19.2** · **Tailwind 4** (CSS tokens, dark theme) |
| Database | **SQLite + Drizzle ORM** *(belum aktif — Phase 0)* |
| WA Bridge | Service terpisah di **VPS `solusiadmin-core-vps`** — **SUDAH JALAN** (Hermes WA Bridge Baileys) |
| AI CS | **mina-cs** (profile Hermes di VPS) — jawab sesuai Rules & SOP, koneksi **MCP** di v1 |
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
├── PRD.md                 # Product Requirements Document v0.4.1
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
| **Phase 0** | Frontend statis (11 halaman, data dummy, dark theme Mina Forge), review PRD → **v0.4.1** (semua keputusan terkunci) | ✅ Selesai |
| **Phase 1 (MVP)** | Auth + SQLite/Drizzle, integrasi WA Bridge (baca status, REST/Webhook), Contacts CRUD + dedupe, Inbox real, **Follow-up engine** (safety engine, retry 3x, pause on disconnect), Tasks + reminder | ⬜ Belum |
| **Phase 2** | Sequence editor, Deals CRUD (6 stage), **AI CS (mina-cs) via MCP**, Reports (response rate + funnel + health) | ⬜ Belum |
| **Phase 3** | Broadcast aman (10/batch, schedule), export/backup, recurring task, chat grup (baca) | ⬜ Nanti |

## 📚 SSOT (Single Source of Truth)

| Lokasi | Isi |
|---|---|
| `D:\DOCUMENT\Mina-UI-SSOT\` | Style guide UI (dark + kuning), folder `design/` (referensi gambar) |
| `docs/PRD.md` | Product Requirements Document **v0.4.1** — 9 menu core features direview, semua open questions resolved |
| Repo ini | Kode sumber + diagram (`docs/*.html`) |

## 📝 Catatan

- **Bukan SaaS** — keputusan: konsep multi-tenant = red ocean, ditunda. Fokus backend pribadi.
- **WA Bridge terpisah** dari app (jalan 24/7 di VPS, komunikasi REST + Webhook). **QR lifecycle = tanggung jawab bridge** — Mina-UI tidak bikin QR connect sendiri.
- **MCP dipakai di v1** untuk jalur AI CS (Mina-UI → mina-cs). Bridge tetap REST + Webhook untuk jalur pesan.
- **Keputusan kunci v0.4.1**: delay FU dihitung dari step sebelumnya terkirim · timezone WIB dikunci · semua pesan masuk = balasan → stop sequence · AI CS read-only ke data CRM (bisa baca kontak/deal, gak bisa edit) · backup lokal + CSV manual di v1.
- **Kanal v1: WhatsApp only** (Telegram pernah dibahas, ditolak). Chat grup skip di v1.
- **Data HJB = lane Devsandbox** — Nexgent tidak menyentuh data produksi; dashboard pakai sample anonim.

---

*Dibuat untuk Bang Handry · Next.js 16 · React 19 · Tailwind 4 · SQLite + Drizzle (rencana)*