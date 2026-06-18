# Laporan Aplikasi Web MedRecord

## 1. Nama Web

**MedRecord**

MedRecord merupakan singkatan dari **Medical Record**, yang berarti rekam medis. Nama ini dipilih karena aplikasi berfokus pada pengelolaan data medis klinik secara digital, terstruktur, dan mudah diakses sesuai hak akses pengguna.

**Slogan:**  
**Accurate Records, Better Care**

Slogan tersebut menggambarkan tujuan utama aplikasi, yaitu membantu klinik memiliki pencatatan medis yang akurat sehingga pelayanan terhadap pasien dapat menjadi lebih baik.

## 2. Base On

MedRecord berbasis **framework-based web application** dengan **custom internal CMS**.

Artinya, MedRecord bukan dibuat menggunakan CMS siap pakai seperti WordPress, Joomla, atau Drupal. Aplikasi ini dibangun menggunakan framework modern, yaitu Next.js pada frontend dan Express.js pada backend. Selain itu, MedRecord memiliki fitur CMS internal yang dibuat khusus agar admin dapat mengelola konten dan konfigurasi website.

Kesimpulan:

| Kategori | Keterangan |
|---|---|
| CMS | Menggunakan custom/internal CMS, bukan CMS siap pakai |
| Native | Bukan aplikasi native Android/iOS |
| Framework | Ya, berbasis framework Next.js dan Express.js |

Dengan demikian, base aplikasi ini adalah:

> **Framework-based web app dengan custom internal CMS.**

## 3. Bahasa Pemrograman yang Digunakan

Bahasa pemrograman utama yang digunakan dalam MedRecord adalah:

| Bahasa | Penggunaan |
|---|---|
| TypeScript | Bahasa utama untuk frontend dan backend |
| JavaScript | Digunakan melalui ekosistem Node.js dan React |
| SQL | Digunakan secara tidak langsung melalui Prisma ORM dan PostgreSQL |
| HTML | Struktur halaman web melalui React/Next.js |
| CSS | Styling melalui Tailwind CSS |

TypeScript digunakan agar kode lebih aman, mudah dirawat, dan memiliki pengecekan tipe data saat proses development.

## 4. Tech Stack yang Digunakan

### Frontend

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Zustand
- React Hook Form
- Zod
- Axios
- Socket.IO Client
- Lucide React
- TanStack Query / React Query
- Next/Image
- Vercel Analytics

### Backend

- Node.js
- Express.js
- TypeScript
- Prisma ORM
- PostgreSQL
- Socket.IO
- JWT Access Token
- Refresh Token
- bcrypt
- Helmet
- Rate Limiting
- Zod Validation
- Multer
- Vercel Blob

### Database

- PostgreSQL
- Prisma Schema
- Prisma Migration
- Database Indexing
- Server-side Pagination

### Authentication dan Security

- JWT Authentication
- Refresh Token
- Role Based Access Control
- Password hashing menggunakan bcrypt
- Request validation menggunakan Zod
- Helmet security headers
- Rate limiting
- Audit log
- Secure upload handling
- Environment variables menggunakan `.env`

### Realtime

- Socket.IO
- Realtime queue update
- Realtime notification
- Realtime CMS update

### Deployment dan Hosting

- Vercel untuk frontend
- Railway untuk backend
- Railway PostgreSQL untuk database
- Vercel Blob untuk penyimpanan gambar/file
- GitHub untuk version control

### Tools dan Quality

- ESLint
- TypeScript strict mode
- Bundle Analyzer
- Next.js `loading.tsx`
- Modular architecture
- Controller layer
- Service layer
- Schema validation layer
- Clean folder structure
- Git dan GitHub workflow

## 5. Web Tentang Apa?

MedRecord adalah aplikasi web rekam medis klinik yang digunakan untuk membantu proses digitalisasi pelayanan klinik.

Aplikasi ini mencakup proses administrasi, pelayanan medis, antrian, farmasi, pembayaran, laporan, pengaturan website, dan portal pasien. MedRecord dirancang agar data klinik dapat dikelola secara lebih rapi, cepat, aman, dan terintegrasi.

Secara umum, MedRecord membahas tentang:

- Pengelolaan data pasien
- Pengelolaan rekam medis
- Pengelolaan dokter dan petugas klinik
- Pendaftaran kunjungan pasien
- Sistem antrian realtime
- Pencatatan vital sign
- Resep dan obat
- Pembayaran dan invoice
- Portal pasien
- Laporan klinik
- Pengaturan konten website melalui CMS internal

## 6. Fungsi Aplikasi

Fungsi utama MedRecord adalah membantu klinik mengelola seluruh alur pelayanan pasien secara digital dari awal sampai akhir.

Alur utama aplikasi:

1. Pasien melakukan pendaftaran atau dibuatkan data oleh petugas.
2. Petugas melakukan pendaftaran kunjungan pasien.
3. Sistem membuat antrian berdasarkan poli tujuan.
4. Perawat dapat mengisi vital sign.
5. Dokter melakukan pemeriksaan dan mengisi rekam medis.
6. Dokter dapat membuat resep.
7. Status kunjungan masuk ke tahap pembayaran.
8. Kasir memproses invoice dan pembayaran.
9. Pasien dapat melihat riwayat kunjungan, rekam medis, resep, dan invoice melalui portal pasien.
10. Admin dapat memantau sistem, laporan, backup, keamanan, dan konten website.

Dengan fungsi tersebut, MedRecord membantu klinik mengurangi pencatatan manual dan membuat data lebih mudah dicari serta dikelola.

## 7. Role Pengguna

MedRecord memiliki sistem role agar setiap pengguna hanya dapat mengakses fitur sesuai kebutuhan dan kewenangannya.

| Role | Fungsi Utama |
|---|---|
| Admin | Mengelola sistem, CMS, user, laporan, backup, monitoring, dan keamanan |
| Dokter / Operasional Klinik | Mengelola pasien, kunjungan, antrian, rekam medis, resep, vital sign, dan pelayanan klinik |
| Pasien | Mengakses portal pasien, melihat riwayat kunjungan, rekam medis, resep, dan pembayaran |

Role dibuat agar sistem lebih aman dan data medis tidak dapat diakses sembarang pengguna.

## 8. Fitur Utama

### Authentication

Fitur login dan register menggunakan sistem autentikasi berbasis JWT dan refresh token. Password disimpan menggunakan hashing bcrypt agar lebih aman.

### Dashboard

Dashboard menampilkan ringkasan data operasional seperti jumlah pasien, kunjungan, antrian, resep, pembayaran, dan stok obat.

### User & Role Management

Admin dapat mengelola user dan role pengguna. Fitur ini digunakan untuk mengatur akses pengguna sesuai tugasnya.

### Patient Management

Fitur ini digunakan untuk mengelola data pasien, termasuk data identitas, NIK, tanggal lahir, jenis kelamin, nomor telepon, alamat, golongan darah, alergi, dan data lain yang diperlukan.

### Visit Registration

Fitur pendaftaran kunjungan digunakan untuk mencatat pasien yang datang ke klinik dan menentukan poli tujuan.

### Queue System

Sistem antrian berjalan realtime menggunakan Socket.IO. Antrian dapat dibuat, dipanggil, dilewati, diselesaikan, atau dibatalkan.

### Voice Queue Calling

Sistem mendukung pemanggilan antrian menggunakan Web Speech API, sehingga nomor antrian dapat dipanggil dengan suara.

### Vital Signs

Petugas dapat mencatat tanda vital pasien seperti tekanan darah, suhu, berat badan, tinggi badan, nadi, dan informasi pemeriksaan awal.

### Medical Records

Dokter dapat mencatat anamnesis, diagnosis, tindakan, catatan medis, dan biaya tindakan.

### Prescriptions

Dokter dapat membuat resep dengan beberapa obat sekaligus, termasuk dosis, jumlah, dan aturan pakai masing-masing obat.

### Pharmacy dan Medicine Stock

Fitur obat digunakan untuk mengelola data obat, stok obat, harga obat, dan riwayat perubahan stok.

### Cashier dan Payment

Kasir dapat memproses pembayaran berdasarkan kunjungan yang sudah siap bayar. Invoice dibuat otomatis dari biaya konsultasi, biaya tindakan, dan biaya obat.

### Patient Portal

Pasien dapat mengakses portal pribadi untuk melihat data kesehatan miliknya, riwayat kunjungan, rekam medis, resep, invoice, dan informasi klinik.

### Reports

Admin dapat melihat laporan kunjungan, pasien baru, diagnosis, tindakan, obat, dan keuangan.

### Settings dan CMS

Admin dapat mengatur nama website, logo, favicon, tema, footer, landing page, banner, SEO, dan konten informasi yang tampil di website.

### Audit Logs

Sistem mencatat aktivitas penting pengguna untuk kebutuhan keamanan dan pelacakan.

### Backup dan Recovery

Admin dapat membuat backup data, melihat riwayat backup, mengunduh backup, dan melakukan restore konfigurasi tertentu secara aman.

### Monitoring Sistem

Admin dapat melihat kondisi sistem seperti storage, memory, CPU, status database, job queue, dan error log.

## 9. Arsitektur Aplikasi

MedRecord menggunakan arsitektur modular agar kode lebih mudah dirawat dan dikembangkan.

### Frontend

Frontend menggunakan Next.js App Router. Komponen dipisahkan berdasarkan fungsi, seperti UI global, layout, shared component, dan feature component.

Struktur umum frontend:

```txt
frontend/
└── src/
    ├── app/
    ├── components/
    ├── features/
    ├── hooks/
    ├── lib/
    ├── services/
    ├── store/
    ├── types/
    ├── utils/
    ├── constants/
    └── validations/
```

### Backend

Backend menggunakan Express.js dan dipisahkan berdasarkan module. Setiap module dapat memiliki routes, controller, service, dan schema.

Struktur umum backend:

```txt
backend/
└── src/
    ├── config/
    ├── constants/
    ├── middleware/
    ├── modules/
    ├── socket/
    ├── types/
    ├── utils/
    └── server.ts
```

Pemisahan layer:

| Layer | Fungsi |
|---|---|
| Routes | Mendefinisikan endpoint |
| Controller | Mengatur request dan response |
| Service | Menangani business logic |
| Schema | Validasi input |
| Middleware | Auth, RBAC, validation, error handling |

## 10. Keamanan

MedRecord menerapkan beberapa fitur keamanan penting, antara lain:

- Password hashing menggunakan bcrypt
- JWT access token
- Refresh token
- Role Based Access Control
- Validasi input menggunakan Zod
- Helmet security headers
- Rate limiting
- Audit log
- Environment variables untuk secret
- Pembatasan akses data pasien
- Secure upload handling

Data pasien dan rekam medis hanya dapat diakses oleh role yang memiliki izin.

## 11. Performa

Beberapa pendekatan performa yang digunakan:

- Server-side pagination
- Search dengan limit data
- Tidak mengambil seluruh data sekaligus
- Lazy loading dan dynamic rendering sesuai kebutuhan
- Skeleton/loading state
- React Query untuk caching data
- Next/Image untuk optimasi gambar
- Bundle Analyzer untuk analisis ukuran bundle
- Struktur komponen modular agar render lebih efisien

## 12. Deployment

MedRecord dirancang agar dapat dijalankan secara lokal maupun online.

Deployment yang digunakan:

| Bagian | Platform |
|---|---|
| Frontend | Vercel |
| Backend | Railway |
| Database | Railway PostgreSQL |
| File/Image Storage | Vercel Blob |
| Version Control | GitHub |

## 13. Kesimpulan

MedRecord adalah aplikasi web rekam medis klinik berbasis framework modern yang dilengkapi custom internal CMS. Aplikasi ini dibuat untuk membantu klinik mengelola data pasien, pelayanan medis, antrian, resep, pembayaran, laporan, dan portal pasien secara digital.

Dengan slogan **Accurate Records, Better Care**, MedRecord menekankan pentingnya pencatatan medis yang akurat untuk meningkatkan kualitas pelayanan kesehatan.
