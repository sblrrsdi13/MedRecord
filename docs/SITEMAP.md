# Sitemap Aplikasi Web Rekam Medis Klinik

Dokumen ini menjelaskan struktur halaman, pembagian akses role, dan alur navigasi utama pada aplikasi Web Rekam Medis Klinik. Dokumen disusun sebagai bahan laporan dan dapat dikonversi ke PDF.

## 1. Ringkasan Aplikasi

Aplikasi ini digunakan untuk mengelola proses operasional klinik mulai dari pendaftaran pasien, antrian, pemeriksaan awal, rekam medis, resep, stok obat, pembayaran, notifikasi, laporan, hingga audit log.

Sistem memiliki dua area utama:

- **Portal Klinik**, digunakan oleh admin dan petugas klinik.
- **Portal Pasien**, digunakan oleh pasien untuk melihat data kesehatannya sendiri.

## 2. Role Pengguna

| Role | Deskripsi | Area Akses |
|---|---|---|
| Admin | Mengelola sistem, user, laporan, audit, dan konfigurasi | Admin Sistem |
| Receptionist | Mengelola pasien, kunjungan, antrian, dan proses front office | Portal Klinik |
| Nurse | Mengelola pemeriksaan awal, vital sign, serta membantu alur klinis | Portal Klinik |
| Doctor | Mengelola rekam medis, diagnosis, tindakan, dan resep | Portal Klinik |
| Pharmacy | Mengelola resep dan stok obat | Portal Klinik |
| Cashier | Mengelola invoice dan pembayaran | Portal Klinik |
| Patient | Melihat data pribadi, kunjungan, rekam medis, resep, dan invoice sendiri | Portal Pasien |

## 3. Struktur Navigasi Sidebar

### 3.1 Utama

| Halaman | URL | Role | Fungsi |
|---|---|---|---|
| Dashboard | `/dashboard` | Admin, Receptionist, Nurse, Doctor, Pharmacy, Cashier | Ringkasan data klinik, statistik kunjungan, antrian, invoice, dan aktivitas terbaru |
| Patient Portal | `/patient-portal` | Patient | Portal khusus pasien untuk melihat data kesehatan pribadi |
| Notifikasi | `/notifications` | Admin, Receptionist, Nurse, Doctor, Pharmacy, Cashier | Mengirim dan membaca notifikasi sistem atau operasional klinik |

### 3.2 Front Office

| Halaman | URL | Role | Fungsi |
|---|---|---|---|
| Pasien | `/patients` | Receptionist, Nurse, Doctor, Pharmacy, Cashier | Input, edit, hapus, dan melihat data pasien |
| Kunjungan | `/visits` | Receptionist, Nurse, Doctor, Pharmacy, Cashier | Pendaftaran kunjungan pasien ke poli |
| Antrian | `/queues` | Receptionist, Nurse, Doctor, Pharmacy, Cashier | Membuat, memanggil, melewati, menyelesaikan, dan menampilkan antrian realtime |

### 3.3 Klinis

| Halaman | URL | Role | Fungsi |
|---|---|---|---|
| Vital Sign | `/vital-signs` | Receptionist, Nurse, Doctor, Pharmacy, Cashier | Input dan pengelolaan tanda vital pasien |
| Rekam Medis | `/medical-records` | Receptionist, Nurse, Doctor, Pharmacy, Cashier | Input diagnosis, anamnesis, tindakan, biaya tindakan, dan catatan klinis |
| Resep | `/prescriptions` | Receptionist, Nurse, Doctor, Pharmacy, Cashier | Input resep dokter dan status persiapan obat |

### 3.4 Master Klinik

| Halaman | URL | Role | Fungsi |
|---|---|---|---|
| Dokter | `/doctors` | Receptionist, Nurse, Doctor, Pharmacy, Cashier | Mengelola profil dokter dan relasi dokter dengan poli |
| Poli | `/polyclinics` | Receptionist, Nurse, Doctor, Pharmacy, Cashier | Mengelola poli, kode, prefix antrian, status aktif, dan biaya konsultasi |
| Jadwal Dokter | `/doctor-schedules` | Receptionist, Nurse, Doctor, Pharmacy, Cashier | Mengelola jadwal praktik dokter per poli |

Catatan:

- Akun dokter hanya melihat jadwal dokter terkait.
- Pengaturan jadwal idealnya dilakukan oleh petugas operasional seperti receptionist atau koordinator klinik.

### 3.5 Farmasi & Kasir

| Halaman | URL | Role | Fungsi |
|---|---|---|---|
| Stok Obat | `/medicines` | Receptionist, Nurse, Doctor, Pharmacy, Cashier | Mengelola master obat, harga, stok, dan stok minimum |
| Kasir | `/payments` | Receptionist, Nurse, Doctor, Pharmacy, Cashier | Melihat kunjungan READY_TO_PAY, menghitung tagihan otomatis, memproses pembayaran, dan mencetak invoice |

### 3.6 Admin Sistem

| Halaman | URL | Role | Fungsi |
|---|---|---|---|
| User | `/users` | Admin | Melihat, edit, nonaktifkan, dan hapus permanen user |
| Register User | `/register` | Admin | Membuat akun petugas klinik |
| Reports | `/reports` | Admin | Melihat laporan dan ringkasan operasional |
| Audit Logs | `/audit-logs` | Admin | Melihat log aktivitas sistem dengan bahasa yang mudah dipahami |
| Settings | `/settings` | Admin | Konfigurasi sistem |

## 4. Halaman Authentication

| Halaman | URL | Akses | Fungsi |
|---|---|---|---|
| Login | `/login` | Public | Login semua role melalui satu halaman |
| Register Pasien | `/login/register` | Public | Pasien melakukan registrasi akun sendiri |
| Root | `/` | Public | Mengarahkan pengguna ke halaman yang sesuai |

## 5. Halaman Akun

| Halaman | URL | Role | Fungsi |
|---|---|---|---|
| Profile | `/profile` | User login | Mengubah nama, email, nomor telepon, dan password |

Menu profile berada pada bagian bawah sidebar. Pengguna perlu klik area profile untuk membuka pilihan **Setting Profile** dan **Logout**.

## 6. Halaman Legacy / Redirect

Beberapa route dipertahankan agar link lama tetap aman, tetapi diarahkan ke modul utama.

| URL Lama | Arah Baru | Keterangan |
|---|---|---|
| `/nurses` | `/users` | Data nurse dikelola melalui user dan role |
| `/staff` | `/users` | Data staff dikelola melalui user dan role |
| `/pharmacy` | `/prescriptions` | Workflow pharmacy berpusat pada resep dan stok obat |

## 7. Alur Utama Sistem

### 7.1 Alur Login

```text
Seeder membuat akun Admin pertama
        ↓
Admin login
        ↓
Admin membuat akun dokter dan staff
        ↓
Pasien dapat daftar sendiri melalui /login/register
        ↓
Semua user login melalui /login
        ↓
Sistem mengarahkan user sesuai role
```

### 7.2 Alur Pendaftaran Pasien dan Kunjungan

```text
Petugas membuka /patients
        ↓
Input data pasien
        ↓
Petugas membuka /visits
        ↓
Pilih pasien dan poli
        ↓
Kunjungan dibuat
        ↓
Antrian dapat dibuat melalui /queues
```

### 7.3 Alur Antrian

```text
Petugas membuat nomor antrian
        ↓
Nomor antrian masuk daftar realtime
        ↓
Petugas klik Panggil
        ↓
TV display dan voice queue calling aktif
        ↓
Status antrian dapat menjadi waiting, called, in_progress, skipped, completed, atau cancelled
```

### 7.4 Alur Klinis

```text
Pasien terdaftar pada kunjungan
        ↓
Nurse / petugas input vital sign
        ↓
Dokter input rekam medis
        ↓
Status kunjungan menjadi examined
        ↓
Dokter input resep
        ↓
Status kunjungan menjadi READY_TO_PAY
```

### 7.5 Alur Kasir dan Invoice

```text
Dokter selesai input rekam medis dan resep
        ↓
Status kunjungan otomatis menjadi READY_TO_PAY
        ↓
Kasir membuka /payments
        ↓
Kasir melihat daftar kunjungan READY_TO_PAY
        ↓
Kasir memilih pasien
        ↓
Detail tagihan muncul otomatis:
  - Biaya konsultasi dari data poli
  - Biaya tindakan dari rekam medis
  - Biaya obat dari resep dan harga obat
        ↓
Kasir input diskon jika ada
        ↓
Kasir memilih metode bayar:
  - Cash
  - Transfer
  - BPJS
        ↓
Kasir input jumlah dibayar jika metode Cash
        ↓
Kasir klik Proses Pembayaran
        ↓
Invoice otomatis dibuat
        ↓
Payment detail otomatis tersimpan
        ↓
Status kunjungan menjadi paid jika lunas
```

### 7.6 Alur Portal Pasien

```text
Pasien login melalui /login
        ↓
Sistem mengarahkan ke /patient-portal
        ↓
Pasien melihat:
  - Profil
  - Riwayat kunjungan
  - Rekam medis
  - Resep
  - Invoice pembayaran
        ↓
Pasien dapat membayar invoice dari portal jika invoice tersedia
```

## 8. Sistem Notifikasi

Notifikasi tersedia untuk role staff klinik dan pasien sesuai penerima.

Fitur notifikasi:

- Realtime menggunakan Socket.IO
- Masuk tanpa refresh halaman
- Warna dibedakan berdasarkan type:
  - `info`
  - `success`
  - `warning`
  - `danger`
- Bisa ditandai dibaca
- Bisa hapus satu notifikasi
- Bisa clear semua notifikasi

## 9. Sistem Print

Fitur print tidak mencetak tampilan website secara penuh. Sistem membuat dokumen khusus untuk:

- Bukti pendaftaran kunjungan
- Invoice pembayaran

Format print dibuat lebih resmi dan hanya berisi data yang relevan.

## 10. Matriks Akses Ringkas

| Modul | Admin | Operational Roles | Patient |
|---|---:|---:|---:|
| Dashboard | Ya | Ya | Tidak |
| Patient Portal | Tidak | Tidak | Ya |
| User Management | Ya | Tidak | Tidak |
| Register Staff | Ya | Tidak | Tidak |
| Pasien | Tidak | Ya | Tidak |
| Kunjungan | Tidak | Ya | Tidak |
| Antrian | Tidak | Ya | Tidak |
| Vital Sign | Tidak | Ya | Tidak |
| Rekam Medis | Tidak | Ya | Tidak |
| Resep | Tidak | Ya | Tidak |
| Dokter | Tidak | Ya | Tidak |
| Poli | Tidak | Ya | Tidak |
| Jadwal Dokter | Tidak | Ya | Tidak |
| Stok Obat | Tidak | Ya | Tidak |
| Kasir / Payment | Tidak | Ya | Tidak |
| Notifikasi | Ya | Ya | Melalui portal pasien |
| Reports | Ya | Tidak | Tidak |
| Audit Logs | Ya | Tidak | Tidak |
| Settings | Ya | Tidak | Tidak |
| Profile | Ya | Ya | Ya |

## 11. Catatan Implementasi

- Frontend menggunakan Next.js App Router.
- Backend menggunakan Express.js dan Prisma ORM.
- Database menggunakan PostgreSQL.
- Authentication menggunakan JWT access token dan refresh token.
- Authorization menggunakan RBAC.
- Realtime menggunakan Socket.IO.
- Form input dibuat konsisten dengan style modal input pasien.
- Sidebar sudah dikelompokkan agar alur penggunaan lebih mudah dipahami.
