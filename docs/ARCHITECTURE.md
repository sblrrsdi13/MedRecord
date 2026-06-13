# Architecture

## Ringkasan

Aplikasi memakai arsitektur modular dengan pemisahan jelas antara UI, service API, validasi, middleware keamanan, repository database, dan realtime event. Backend menjadi sumber kebenaran untuk autentikasi, RBAC, audit log, dan data medis. Frontend hanya menyimpan access token di memory/Zustand dan refresh token dikirim lewat cookie httpOnly.

## Layer Backend

1. `server.ts`: bootstrap Express, HTTP server, dan Socket.IO.
2. `config`: env, Prisma client, konfigurasi keamanan.
3. `middleware`: auth JWT, RBAC, validasi Zod, rate limit, error handler, audit context.
4. `modules/*`: route, controller, service, schema per domain.
5. `repositories`: akses database reusable untuk query umum.
6. `socket`: channel realtime, room per poli, broadcast queue update.

## Layer Frontend

1. `app`: routing App Router, layout auth/dashboard.
2. `components/ui`: komponen UI dasar bergaya shadcn.
3. `components/dashboard`, `queue`, `patient`: komponen domain.
4. `services`: Axios client dan API wrapper.
5. `store`: Zustand untuk auth/session.
6. `hooks`: custom hook realtime queue, debounce, dan data fetching ringan.
7. `validations`: schema Zod untuk form.

## Security

- Password memakai bcrypt.
- Access token pendek, refresh token disimpan hash di database.
- Cookie refresh token: `httpOnly`, `sameSite=strict`, `secure` saat production.
- RBAC diverifikasi di backend, bukan hanya sidebar frontend.
- Helmet, CORS allowlist, rate limit, sanitasi body, validasi Zod.
- Prisma parameterized query mencegah SQL injection.
- Audit log untuk aksi penting.

## Performance

- Server-side pagination pada endpoint list.
- Index database pada kolom pencarian/status/tanggal.
- Frontend memecah komponen client hanya untuk bagian interaktif.
- Search memakai debounce.
- Queue realtime memakai room Socket.IO per poli.
