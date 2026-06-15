# Professional Hardening Plan - Sistem Rekam Medis Klinik

Dokumen ini menjadi panduan agar aplikasi tetap rapi, aman, ringan, dan siap produksi tanpa rewrite besar. Fokus utamanya adalah workflow klinik, keamanan data pasien, performa, dan maintainability.

## Prinsip Utama

- Jangan menghapus fitur yang sudah berjalan.
- Perubahan database harus lewat migration yang aman dan backward-compatible.
- Workflow klinik harus jelas dari pendaftaran sampai invoice.
- Data medis harus dilindungi dengan RBAC, audit log, dan validasi ownership.
- Fitur baru harus modular dan tidak membuat bundle frontend membengkak.
- Animasi UI harus ringan: prioritaskan `transform` dan `opacity`, hindari efek berat di list panjang.

## Workflow Klinik

```text
Pasien / Front Office
`-- Pendaftaran kunjungan
    |-- Pilih pasien
    |-- Pilih poli aktif
    |-- Isi keluhan awal
    `-- Generate antrian

Antrian
`-- Status
    |-- waiting
    |-- called
    |-- in_progress
    |-- skipped
    |-- completed
    `-- cancelled

Nurse / Vital Sign
`-- Input tanda vital
    |-- Tekanan darah
    |-- Suhu
    |-- Nadi
    |-- Respirasi
    |-- Berat / tinggi
    `-- Catatan awal

Doctor
`-- Rekam medis
    |-- Anamnesis
    |-- Diagnosis
    |-- Tindakan
    |-- Biaya tindakan
    |-- Catatan
    `-- Resep multi-obat

Farmasi
`-- Resep
    |-- Verifikasi resep
    |-- Siapkan obat
    |-- Kurangi stok
    `-- Dispense

Kasir
`-- Payment
    |-- Ambil kunjungan READY_TO_PAY
    |-- Hitung biaya konsultasi dari poli
    |-- Hitung biaya tindakan dari rekam medis
    |-- Hitung biaya obat dari resep
    |-- Input diskon
    |-- Pilih metode bayar
    |-- Proses pembayaran
    `-- Cetak invoice

Portal Pasien
`-- Data pribadi pasien
    |-- Riwayat kunjungan
    |-- Rekam medis milik sendiri
    |-- Resep milik sendiri
    |-- Invoice / histori pembayaran
    `-- Pengaturan akun
```

## Status Kunjungan

```text
registered
waiting
examined
prescribed
ready_to_pay
paid
completed
cancelled
```

Catatan:

- Status hanya boleh maju untuk status operasional normal.
- `ready_to_pay` muncul setelah rekam medis atau resep membuat kunjungan siap diproses kasir.
- `paid` hanya boleh ditetapkan oleh kasir atau integrasi pembayaran valid.
- Portal pasien boleh melihat invoice dan histori pembayaran, tetapi pembayaran online nyata perlu gateway/verifikasi.

## Fase 1 - Hardening Tanpa Breaking Change

```text
Security
|-- Audit log create/update/delete rekam medis
|-- Audit log payment
|-- Audit log resep
|-- Audit log kunjungan
|-- Audit log aksi pasien sensitif
|-- Validasi rekam medis agar tidak silang pasien
`-- Error API lebih tepat untuk data tidak ditemukan

Reliability
|-- Visit workflow service
|-- Guard status agar tidak turun
|-- Validasi pasien dan poli saat kunjungan dibuat
`-- Build backend/frontend harus lolos

Frontend Performance
|-- Reusable password input
|-- Hilangkan double native password reveal icon
|-- Deferred search di tabel besar
|-- Render pagination client-side untuk tabel legacy
`-- Socket realtime dibuka setelah idle
```

## Fase 2 - Pagination dan Search

```text
Backend
|-- /visits?page=&limit=&search=
|-- /medical-records?page=&limit=&search=
|-- /prescriptions?page=&limit=&search=
|-- /payments?page=&limit=&search=
|-- /audit-logs?page=&limit=&search=
|-- /medicines?page=&limit=&search=
|-- /users?page=&limit=&search=
`-- /vital-signs?page=&limit=&search=

Compatibility
|-- Request lama tanpa query tetap mengembalikan array
`-- Request baru dengan query mengembalikan { items, meta }

Frontend
|-- ModulePage membaca { items, meta }
|-- VisitRegistrationTable memakai server pagination
`-- Form lama tetap kompatibel
```

## Fase 3 - Database Index Migration

Migration:

```text
backend/prisma/migrations/20260615100000_add_search_performance_indexes/migration.sql
```

Isi utama:

```text
PostgreSQL extension
`-- pg_trgm

B-tree index
|-- visits(status, visit_date)
|-- medical_records(created_at)
|-- prescriptions(status, created_at)
|-- payments(status, created_at)
|-- audit_logs(created_at)
|-- users(created_at)
|-- vital_signs(patient_id, created_at)
`-- vital_signs(created_at)

GIN trigram index
|-- patients(name)
|-- patients(patient_code)
|-- patients(medical_record_no)
|-- patients(nik)
|-- users(name)
|-- users(email)
|-- users(phone)
|-- visits(visit_no)
|-- visits(complaint)
|-- medical_records(diagnosis)
|-- medical_records(treatment)
|-- vital_signs(blood_pressure)
|-- vital_signs(notes)
|-- payments(invoice_no)
|-- payment_details(item_name)
|-- medicines(code)
|-- medicines(name)
|-- medicines(unit)
|-- audit_logs(action)
|-- audit_logs(resource)
`-- audit_logs(ip_address)
```

Cara menjalankan migration:

```bash
cd backend
npm run prisma:deploy
```

Untuk local development yang ingin membuat migration baru:

```bash
cd backend
npm run prisma:migrate
```

## Fase 4 - Migration Kandidat Berikutnya

```text
CMS
|-- cms_versions
|-- draft / published state
`-- restore version

Security
|-- sessions
|-- refresh token rotation metadata
|-- two factor settings
`-- IP whitelist policy

Clinical
|-- medical_record_status
|-- diagnosis_code
|-- attachments
`-- prescription_status enum

Payment
|-- payment_events
|-- cashier_id
|-- payment_verified_at
`-- online_payment_reference
```

## Fase 5 - Testing

```text
Backend Tests
|-- Auth login/register/refresh
|-- RBAC endpoint sensitif
|-- Patient portal ownership
|-- Visit workflow
|-- Medical record create/update
|-- Prescription multi item
`-- Payment ready_to_pay

Frontend E2E
|-- Login admin
|-- Login dokter
|-- Login pasien
|-- Tambah kunjungan
|-- Rekam medis
|-- Resep
|-- Payment
`-- Portal pasien
```

## Aturan Performa

- Tabel besar wajib server-side pagination atau virtualization.
- Search harus debounce/deferred.
- Socket realtime tidak dibuka lebih dari yang diperlukan.
- Gambar CMS wajib punya batas ukuran dan fallback.
- Data master yang jarang berubah boleh di-cache.
- Hindari `JSON.stringify(row)` untuk pencarian tabel.
- Hindari nested include yang tidak dipakai UI.

## Risiko yang Harus Diwaspadai

- Mengubah payment pasien dari langsung `paid` menjadi `pending` akan mengubah behavior UI.
- Lock/finalize rekam medis membutuhkan field status baru.
- Draft/published CMS membutuhkan tabel versioning.
- Device session management membutuhkan tabel session/refresh token metadata.
