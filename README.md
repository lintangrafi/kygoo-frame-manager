# Kygoo Frame Studio

Full-stack photo frame editor for photo studios. Staff uploads frame templates with slot definitions, customers access their session via slug + 4-digit PIN, compose photos into frames using an HTML5 Canvas editor, and staff review and finalize compositions with server-side PNG export.

**Stack:** Next.js 16 (App Router), TypeScript 5, Tailwind CSS v4, Drizzle ORM + PostgreSQL, sharp (server-side image processing), iron-session (auth), Vitest (testing)

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  Staff Panel                     │
│  /staff/login → /staff (dashboard)              │
│  /staff/sessions → CRUD sessions + photos       │
│  /staff/frames   → Upload frames + define slots │
│                      │                          │
│              iron-session auth                   │
└──────────────────────┼──────────────────────────┘
                       │
┌──────────────────────┼──────────────────────────┐
│                  API Routes                      │
│  /api/auth/*        → login, logout, session    │
│  /api/auth/verify-pin → customer PIN gate       │
│  /api/sessions/*    → session CRUD + photos     │
│  /api/frames/*      → frame CRUD + slot editor  │
│  /api/compositions/* → composition CRUD         │
│  /api/compositions/[id]/export → PNG export     │
│  /api/compositions/[id]/approve → finalize      │
└──────────────────────┼──────────────────────────┘
                       │
┌──────────────────────┼──────────────────────────┐
│              Customer Portal                     │
│  /s/[slug] → PIN gate + gallery                │
│  /s/[slug]/editor/[compId] → Canvas editor     │
│                      │                          │
│         iron-session (customer cookie)           │
└─────────────────────────────────────────────────┘
```

## Database

PostgreSQL with Drizzle ORM. 7 tables:

| Table | Purpose |
|-------|---------|
| `staff` | Admin accounts (email/password via bcrypt) |
| `sessions` | Customer photo sessions with auto-generated slug + 4-digit PIN |
| `photos` | Uploaded RAW photos per session |
| `frames` | Frame templates (PNG) with dimensions |
| `frame_slots` | Slot regions within each frame (x, y, w, h) |
| `compositions` | A customer's frame selection (one per frame choice) |
| `allocations` | Photo-to-slot mapping with zoom, offset, and HSL adjustments |

## Design System

**Direction:** Warm Analog Studio — Indonesian photo studio meets digital craft.

- **Palette:** Cream `#FBF7F0`, Espresso `#2D1810`, Amber `#D4872B`, Mahogany `#5C2D1A`
- **Fonts:** Plus Jakarta Sans (body), Playfair Display (display/headlines)
- **Motifs:** Film-strip card edges, golden gradient dividers, SVG grain texture

## Quick Start (Local Development)

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env.local
# Edit .env.local with your PostgreSQL connection string

# 3. Push database schema
npm run db:push

# 4. Seed default admin account
npm run db:seed
# → admin@kygoo.com / admin123

# 5. Start dev server
npm run dev
# → http://localhost:3000
```

## Environment Variables

Create `.env.local`:

```env
DATABASE_URL=postgresql://user:password@host:5432/kygoo_frame_studio
SESSION_SECRET=random-32-character-secret-string-here
UPLOAD_DIR=./uploads
```

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run db:push` | Push schema changes to PostgreSQL |
| `npm run db:seed` | Seed default admin account |
| `npm run db:generate` | Generate Drizzle migrations |
| `npx vitest run` | Run test suite (93 tests) |

## Test Suite

93 tests across 14 files covering:
- **Unit:** `cn()` class merging, `formatPrice()` IDR formatting, auth session utilities, file upload, middleware
- **API:** Auth routes (login/logout/session), verify-pin validation, frames/sessions CRUD
- **Components:** PinGate, Gallery, Sidebar, SessionList, SessionDetail, FrameList

```bash
npx vitest run
```

---

## AI Agent Deployment Prompt

> Copy the section below and paste it to your AI agent for server deployment.

```
## Deployment Task: Kygoo Frame Studio

Deploy this Next.js 16 application to a production server.

### Server Requirements

| Requirement | Details |
|-------------|---------|
| Node.js | v20+ (tested on v24) |
| PostgreSQL | v15+ with a fresh database |
| Disk | At least 2GB for uploads |
| Port | 3000 (configurable) |

### Deployment Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/lintangrafi/kygoo-frame-manager.git
   cd kygoo-frame-manager
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create PostgreSQL database**
   ```sql
   CREATE DATABASE kygoo_frame_studio;
   ```

4. **Create .env.local file**
   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/kygoo_frame_studio
   SESSION_SECRET=<generate-32-char-random-string>
   UPLOAD_DIR=./uploads
   ```

5. **Push database schema and seed**
   ```bash
   npm run db:push
   npm run db:seed
   ```
   Verifikasi: perintah seed akan menampilkan "Seed complete: admin@kygoo.com / admin123"

6. **Build the application**
   ```bash
   npm run build
   ```
   Expected output: "✓ Compiled successfully" dan "✓ Generating static pages"

7. **Create upload directories**
   ```bash
   mkdir -p uploads/frames uploads/sessions uploads/exports
   ```

8. **Start the server**
   ```bash
   npm run start
   ```
   Server berjalan di port 3000.

   Untuk production, gunakan PM2:
   ```bash
   npm install -g pm2
   pm2 start npm --name "kygoo-frame-studio" -- start
   pm2 save
   pm2 startup
   ```

### Post-Deployment Verification

Setelah server berjalan, verifikasi dengan langkah berikut:

1. **Login staff:** Buka `http://<server>:3000/staff/login`
   - Email: `admin@kygoo.com`
   - Password: `admin123`

2. **Upload frame:** Buka `http://<server>:3000/staff/frames/new`
   - Upload file PNG frame
   - Tambahkan slot (region) pada canvas
   - Simpan

3. **Buat sesi:** Buka `http://<server>:3000/staff/sessions/new`
   - Isi nama pelanggan
   - Upload beberapa foto JPG/PNG
   - Catat slug dan PIN yang muncul di daftar sesi

4. **Customer flow:** Buka `http://<server>:3000/s/<slug>`
   - Masukkan PIN 4-digit
   - Pilih frame dari galeri
   - Atur foto di canvas editor
   - Download hasil PNG

5. **Staff approve:** Kembali ke staff panel
   - Buka sesi yang baru dibuat
   - Klik "Setujui" pada komposisi
   - Verifikasi status berubah ke "Final"

### Troubleshooting

| Masalah | Solusi |
|---------|--------|
| `npm run db:push` gagal | Periksa DATABASE_URL di .env.local. Pastikan PostgreSQL berjalan. |
| Build gagal di TypeScript | Jalankan `npx tsc --noEmit` untuk melihat error detail |
| Upload foto gagal | Pastikan direktori `uploads/` ada dan writable |
| Session tidak persisten | Periksa SESSION_SECRET minimal 32 karakter |
| sharp error saat export | `npm rebuild sharp` untuk mengkompilasi ulang binary sharp |

### File Structure

```
kygoo-frame-studio/
├── src/
│   ├── app/                    # Next.js App Router pages + API routes
│   │   ├── (staff)/           # Staff panel (dashboard, sessions, frames)
│   │   ├── api/               # 14 API route handlers
│   │   ├── s/[slug]/          # Customer portal
│   │   ├── globals.css        # Tailwind + custom design system
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Redirect / → /staff
│   ├── components/            # React components
│   │   ├── editor/            # PhotoEditor (HTML5 Canvas)
│   │   ├── frames/            # FrameList, FrameSlotEditor
│   │   ├── layout/            # Sidebar
│   │   └── session/           # PinGate, Gallery
│   │   └── sessions/          # SessionList, SessionDetail
│   ├── db/                    # Drizzle ORM schema + connection + seed
│   ├── lib/                   # Utilities
│   │   ├── auth/              # iron-session config + helpers
│   │   ├── confetti.ts        # Confetti animation utility
│   │   ├── export.ts          # Server-side sharp composition engine
│   │   ├── upload.ts          # File upload helper
│   │   └── utils.ts           # cn(), formatPrice()
│   ├── middleware.ts          # Staff route protection
│   └── test/                  # 14 test files, 93 tests
├── drizzle.config.ts          # Drizzle Kit config
├── next.config.ts             # Next.js config with Cache-Control headers
├── vitest.config.ts           # Vitest config
├── uploads/                   # Local file storage (frames, sessions, exports)
├── package.json
└── tsconfig.json
```
```

## License

Private — Kygoo Studios
