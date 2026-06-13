# API Flow

## Auth

1. `POST /api/v1/auth/login`
2. Backend validasi Zod, cek user aktif, compare bcrypt.
3. Backend mengirim access token di response dan refresh token di cookie httpOnly.
4. Frontend menaruh access token di Zustand memory.
5. `POST /api/v1/auth/refresh` menerbitkan access token baru bila refresh token valid.
6. `POST /api/v1/auth/logout` revoke refresh token.

## Patient Management

1. Receptionist/Admin membuka `/patients`.
2. Frontend memanggil `GET /api/v1/patients?page=1&search=...`.
3. Backend melakukan pagination dan pencarian indexed.
4. Create/update memakai Zod dan audit log.

## Queue

1. Receptionist membuat antrian: `POST /api/v1/queues`.
2. Backend mengambil sequence harian per poli secara transaction.
3. Queue number dibuat dari prefix poli + sequence tiga digit.
4. Backend broadcast `queue:updated` dan `queue:created` ke room poli.
5. Petugas memanggil: `PATCH /api/v1/queues/:id/call`.
6. Backend broadcast `queue:called`.
7. TV display dan counter menerima event realtime.
8. Frontend menjalankan Web Speech API untuk teks panggilan.

## RBAC

Semua route privat memakai `authenticate` lalu `authorize(["ADMIN", ...])`. Frontend boleh menyembunyikan menu, tetapi backend tetap menjadi enforcement utama.
