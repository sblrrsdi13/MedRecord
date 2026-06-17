# Clinic Medical Record System

Aplikasi Web Rekam Medis Klinik modern berbasis Next.js, Express, Prisma, PostgreSQL, JWT RBAC, dan Socket.IO.

## Struktur

- `frontend`: Next.js App Router, TypeScript, Tailwind, shadcn-style components, Zustand, Axios, Socket.IO Client.
- `backend`: Express TypeScript, Prisma ORM, JWT access token, refresh token, RBAC, Helmet, rate limit, Zod validation.
- `docs`: analisa arsitektur dan API flow.
- `uploads`: placeholder/local development. Production upload menggunakan Vercel Blob.

## Jalankan Development

1. Buat database PostgreSQL `clinic_emr`.
2. Salin env:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
```

3. Install dan migrasi backend:

```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate
npm run seed
npm run dev
```

4. Jalankan frontend:

```bash
cd frontend
npm install
npm run dev
```
    
Login seed:

- Email: `admin@klinik.local`
- Password: `Admin12345`

Login dokter:

- Email: `dokter1@gmail.com`
- Password: `dokter12345`

Login pasien:

- Email: `pasien@gmail.com`
- Password: `pasein123`

## Modul Yang Sudah Dibuat

- Authentication JWT + refresh token cookie.
- RBAC middleware.
- Patient Management API + tabel frontend.
- Polyclinic API.
- Queue API dengan create/call/recall/skip/complete.
- Socket.IO realtime queue update.
- Web Speech API voice queue calling.
- Dashboard shell, sidebar, topbar, cards.
- Prisma schema untuk seluruh tabel utama.

## Dokumentasi

- [Architecture](docs/ARCHITECTURE.md)
- [API Flow](docs/API_FLOW.md)
- [Implementation Status](docs/IMPLEMENTATION_STATUS.md)
- [Database Setup](docs/DATABASE_SETUP.md)
- [Uploads Policy](docs/UPLOADS_POLICY.md)
