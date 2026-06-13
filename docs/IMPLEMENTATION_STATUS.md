# Implementation Status

## Backend

Endpoint utama sudah tersedia dengan RBAC dan validasi dasar:

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/register`
- `GET /api/v1/users`
- `GET|POST|PUT /api/v1/patients`
- `GET /api/v1/doctors`
- `GET|POST /api/v1/nurses`
- `GET|POST /api/v1/staff`
- `GET|POST|PUT /api/v1/polyclinics`
- `GET|POST /api/v1/doctor-schedules`
- `GET|POST /api/v1/visits`
- `GET|POST /api/v1/vital-signs`
- `GET|POST /api/v1/medical-records`
- `GET /api/v1/prescriptions`
- `GET|POST /api/v1/medicines`
- `GET /api/v1/payments`
- `GET /api/v1/reports/summary`
- `GET /api/v1/audit-logs`
- `GET /api/v1/settings`
- `GET|POST /api/v1/queues`
- `PATCH /api/v1/queues/:id/call`
- `PATCH /api/v1/queues/:id/recall`
- `PATCH /api/v1/queues/:id/skip`
- `PATCH /api/v1/queues/:id/complete`

## Frontend

Halaman dashboard sudah tersedia:

- `/login`
- `/dashboard`
- `/patients`
- `/doctors`
- `/nurses`
- `/staff`
- `/polyclinics`
- `/doctor-schedules`
- `/visits`
- `/queues`
- `/vital-signs`
- `/medical-records`
- `/prescriptions`
- `/pharmacy`
- `/medicines`
- `/payments`
- `/reports`
- `/audit-logs`
- `/settings`

## Realtime Queue

Socket.IO event:

- Client emit `queue:join`
- Server emit `queue:created`
- Server emit `queue:updated`
- Server emit `queue:called`

Voice queue calling berjalan di frontend memakai Web Speech API dengan bahasa `id-ID`.

## Next Development

Tahap berikutnya yang paling bernilai:

1. Tambahkan form modal create/update untuk setiap modul.
2. Tambahkan delete/soft delete untuk master data.
3. Tambahkan detail page pasien dan riwayat rekam medis.
4. Tambahkan invoice print dan export laporan PDF.
5. Tambahkan test backend untuk auth, RBAC, queue transaction, dan validation.
