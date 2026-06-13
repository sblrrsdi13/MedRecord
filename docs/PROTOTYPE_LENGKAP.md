# Prototype Lengkap Aplikasi Web Rekam Medis Klinik

Dokumen ini menjelaskan prototype lengkap aplikasi Web Rekam Medis Klinik sebagai bahan laporan, dokumentasi produk, dan panduan pengembangan lanjutan.

## 1. Ringkasan Produk

**Nama aplikasi:** Klinik Utama / Medical Portal  
**Jenis aplikasi:** Web Rekam Medis Klinik modern  
**Target pengguna:** Admin web, tenaga operasional klinik, dan pasien  
**Platform:** Web responsive desktop dan mobile  
**Arsitektur:** Fullstack modular dengan frontend Next.js dan backend Express.js

Prototype ini dirancang untuk membantu klinik mengelola proses pelayanan mulai dari pendaftaran pasien, antrian, pemeriksaan, rekam medis, resep, farmasi, pembayaran, invoice, notifikasi, sampai portal pasien.

Fokus utama sistem:

- Ringan dan cepat.
- Aman untuk data kesehatan.
- Modular dan mudah dikembangkan.
- Responsive untuk desktop dan mobile.
- Memiliki CMS internal agar konten website bisa dikelola admin.
- Memisahkan akses admin web, operasional klinik, dan pasien.

## 2. Tech Stack

### Frontend

- Next.js App Router
- TypeScript strict mode
- Tailwind CSS
- shadcn/ui style components
- Zustand
- React Hook Form
- Zod
- Axios
- Socket.IO Client

### Backend

- Node.js
- Express.js
- TypeScript
- Prisma ORM
- Socket.IO

### Database

- PostgreSQL
- Prisma schema dan migration

### Authentication

- JWT access token
- Refresh token
- Password hashing
- Role Based Access Control

## 3. Pembagian Role

Sistem memakai tiga kelompok besar agar alurnya lebih mudah dipahami.

### 3.1 Admin

Admin tidak difokuskan untuk mengelola data medis harian. Admin difokuskan sebagai pengelola sistem dan CMS.

Hak akses Admin:

- Dashboard Admin Web Control Center.
- Mengelola CMS website.
- Mengubah logo, nama website, warna/tema, hero, footer, sosial media, dan konten publik.
- Mengelola pengumuman dan edukasi.
- Mengelola user dan role.
- Membuat akun dokter/staff.
- Melihat audit logs.
- Melihat monitoring sistem.
- Mengirim notifikasi sistem.
- Mengakses laporan administratif.

Admin tidak ditampilkan menu operasional seperti pasien, rekam medis, kasir, dan resep agar data medis tidak terbuka tidak perlu.

### 3.2 Operasional Klinik

Kelompok ini mencakup dokter, receptionist, nurse, pharmacy, cashier, dan staff klinik. Dalam prototype ini akses operasional dibuat seragam agar workflow klinik lebih sederhana.

Hak akses operasional:

- Dashboard operasional klinik.
- Manajemen pasien.
- Pendaftaran kunjungan.
- Antrian realtime.
- Vital sign.
- Rekam medis.
- Resep.
- Stok obat.
- Kasir dan invoice.
- Jadwal dokter.
- Poliklinik.
- Notifikasi operasional.
- Pengumuman internal.

### 3.3 Pasien

Pasien hanya boleh mengakses data miliknya sendiri.

Hak akses pasien:

- Portal pasien.
- Melihat informasi klinik dan pengumuman publik.
- Melihat profil pasien.
- Melihat riwayat kunjungan sendiri.
- Melihat rekam medis sendiri.
- Melihat resep sendiri.
- Melihat invoice/pembayaran sendiri.
- Menerima notifikasi pasien.
- Mengubah data akun dasar seperti email dan password.

Akun pasien bersifat opsional. Data pasien tetap bisa dibuat oleh operasional walaupun belum terhubung ke akun portal pasien.

## 4. Sitemap Prototype

Sitemap ditulis dalam bentuk tree agar hubungan antar halaman lebih mudah dibaca.

```text
Web Rekam Medis Klinik
|
|-- Public Area
|   |-- /                         Landing page publik klinik
|   |-- /login                    Login semua role
|   `-- /login/register           Register akun portal pasien
|
|-- Admin Area
|   |-- /dashboard                Admin Web Control Center
|   |   |-- Monitoring API
|   |   |-- Monitoring database
|   |   |-- Ringkasan CMS
|   |   `-- Audit log terbaru
|   |
|   |-- /settings                 CMS Settings
|   |   |-- Brand identity
|   |   |-- Logo dan gambar website
|   |   |-- Landing page content
|   |   |-- Portal pasien content
|   |   |-- Footer dan social media
|   |   `-- Preview sebelum save
|   |
|   |-- /announcements            Pengumuman dan edukasi
|   |-- /notifications            Notifikasi sistem/admin
|   |-- /users                    User dan role management
|   |-- /register                 Register akun staff/dokter
|   |-- /reports                  Laporan administratif
|   |-- /audit-logs               Riwayat aktivitas sistem
|   `-- /profile                  Profile admin
|
|-- Operational Area
|   |-- /dashboard                Dashboard operasional klinik
|   |-- /patients                 Manajemen pasien
|   |   |-- Tambah pasien
|   |   |-- Edit pasien
|   |   |-- Nonaktifkan pasien
|   |   `-- Hapus pasien
|   |
|   |-- /visits                   Pendaftaran kunjungan
|   |   |-- Pilih pasien
|   |   |-- Pilih poli
|   |   |-- Keluhan awal
|   |   `-- Generate nomor kunjungan/antrian
|   |
|   |-- /queues                   Sistem antrian realtime
|   |   |-- Panggil antrian
|   |   |-- Recall antrian
|   |   |-- Skip antrian
|   |   |-- Complete antrian
|   |   `-- TV display dan voice calling
|   |
|   |-- /vital-signs              Input tanda vital
|   |-- /medical-records          Rekam medis
|   |-- /prescriptions            Resep
|   |-- /medicines                Obat dan stok
|   |-- /payments                 Kasir, pembayaran, invoice
|   |-- /doctors                  Data dokter
|   |-- /polyclinics              Data poli dan tarif
|   |-- /doctor-schedules         Jadwal dokter
|   |-- /notifications            Notifikasi operasional
|   |-- /announcements            Pengumuman internal/publik
|   `-- /profile                  Profile user operasional
|
`-- Patient Area
    |-- /patient-portal           Portal pasien
    |   |-- Home                  Informasi klinik, edukasi, pengumuman
    |   |-- Visits                Riwayat kunjungan pasien
    |   |-- Medical Records       Rekam medis milik pasien
    |   |-- Prescriptions         Resep milik pasien
    |   `-- Payments              Invoice dan pembayaran pasien
    |
    `-- /profile                  Setting akun pasien
```

## 5. Rancangan Tampilan

### 5.1 Landing Page

Landing page adalah halaman pertama sebelum user login.

Isi utama:

- Header modern sticky.
- Logo klinik dari CMS.
- Navigasi publik: Home, Services, Departments, Doctors, Contact.
- Tombol Login.
- Tombol Daftar Pasien.
- Hero full screen dengan background image.
- Headline layanan kesehatan.
- Section layanan klinik.
- Section departemen/poliklinik.
- Section featured services.
- Footer publik.

Perilaku UI:

- Header awal transparan mengikuti hero.
- Saat scroll, header berubah menjadi glass/blur dengan background agar teks terbaca.
- Konten bawah muncul dengan animasi saat masuk viewport.
- Animasi dapat muncul lagi saat user scroll ulang.
- Semua teks, logo, gambar, dan footer dapat diatur dari CMS admin.

### 5.2 Login dan Register

Login digunakan oleh semua user.

Alur:

1. User membuka `/login`.
2. User memasukkan email dan password.
3. Backend memvalidasi kredensial.
4. Sistem membaca role.
5. User diarahkan sesuai role:
   - Admin ke dashboard admin.
   - Operasional ke dashboard operasional.
   - Pasien ke portal pasien.

Register pasien berada di `/login/register`.

Alur register:

1. Pasien mengisi nama, email, password, dan data dasar.
2. Sistem membuat akun pasien.
3. Akun pasien bisa dihubungkan ke data pasien.
4. Jika belum terhubung, portal menampilkan informasi bahwa akun belum memiliki data pasien.

### 5.3 Admin Web Control Center

Dashboard admin berfungsi sebagai pusat pengelolaan website, bukan pusat operasional medis.

Komponen utama:

- Status API.
- Status database.
- Jumlah user.
- Jumlah user aktif.
- Jumlah pengumuman aktif.
- Audit hari ini.
- Shortcut CMS.
- Shortcut notifikasi.
- Shortcut user management.
- Ringkasan konfigurasi website.
- Audit log terbaru.

CMS Settings:

- Edit nama website.
- Edit tagline.
- Upload logo.
- Upload hero image.
- Edit warna/tema.
- Edit footer.
- Edit sosial media.
- Edit menu publik.
- Edit teks landing page.
- Edit teks portal pasien.
- Preview sebelum save.
- Preview bisa discroll agar admin melihat semua bagian.
- Perubahan tersimpan realtime ke frontend tanpa refresh.

Ketentuan upload gambar:

- Logo direkomendasikan 512 x 512 px.
- Hero image direkomendasikan 1920 x 1080 px.
- Maksimal ukuran file 2 MB.
- Format disarankan PNG, JPG, JPEG, atau WebP.

### 5.4 Dashboard Operasional

Dashboard operasional menampilkan data nyata dari database.

Komponen:

- Total pasien.
- Kunjungan hari ini.
- Antrian menunggu.
- Resep pending.
- Obat stok rendah.
- Pendapatan hari ini.
- Jadwal dan kunjungan terbaru.
- Snapshot antrian.
- Aktivitas operasional yang mudah dipahami.

Dashboard tidak menampilkan audit log karena audit log hanya untuk admin.

### 5.5 Patient Management

Halaman pasien digunakan untuk input dan pengelolaan data pasien.

Fitur:

- Search pasien.
- Pagination server-side.
- Button tambah pasien di area tabel.
- Form tambah pasien berupa modal.
- Modal memakai background blur full screen.
- Form edit pasien memakai modal dan blur yang sama.
- Data bisa diedit jika ada kesalahan.
- Pasien bisa dinonaktifkan.
- Pasien bisa dihapus permanen bila diperlukan.
- Akun portal pasien opsional.

Field utama:

- Nama lengkap.
- NIK.
- Tanggal lahir.
- Jenis kelamin.
- Golongan darah.
- Nomor telepon.
- Alamat.
- Alergi/catatan klinis.
- Nomor rekam medis.
- Akun portal pasien.

### 5.6 Visit Registration

Halaman kunjungan digunakan untuk mendaftarkan pasien ke poli.

Fitur:

- Pilih pasien.
- Pilih poli.
- Pilih dokter jika diperlukan.
- Keluhan awal.
- Status kunjungan.
- Data tampil dalam tabel kompleks seperti sistem klinik.
- Kunjungan menghasilkan nomor pendaftaran.
- Kunjungan dapat menghasilkan antrian.

Status kunjungan:

- REGISTERED
- IN_PROGRESS
- READY_TO_PAY
- PAID
- COMPLETED
- CANCELLED

### 5.7 Queue System

Sistem antrian realtime per poli.

Format nomor:

- A001 untuk Poli Umum.
- G001 untuk Poli Gigi.
- C001 untuk Poli Anak.
- M001 untuk Poli Mata.
- K001 untuk Kasir.
- O001 untuk Apotek.

Status antrian:

- waiting
- called
- in_progress
- skipped
- completed
- cancelled

Fitur:

- Create queue.
- Recall queue.
- Skip queue.
- Complete queue.
- Queue history.
- TV display.
- Realtime update.
- Voice queue calling.
- Pilihan voice/suara dari browser.

Contoh suara:

> Nomor antrian A nol nol satu, silakan menuju Poli Umum.

### 5.8 Vital Signs

Vital sign diinput oleh tenaga operasional sebelum pemeriksaan dokter.

Field:

- Tekanan darah.
- Suhu.
- Nadi.
- Respirasi.
- Berat badan.
- Tinggi badan.
- Catatan.

Data vital sign terhubung ke kunjungan pasien.

### 5.9 Medical Records

Rekam medis diinput oleh dokter/operasional.

Logika dokter:

- Jika akun login adalah dokter, dokter otomatis memakai akun tersebut.
- Tidak perlu memilih dokter secara manual.
- Hal ini mengurangi kesalahan input dan menjaga data pemeriksa tetap akurat.

Field:

- Subjective/keluhan.
- Objective/pemeriksaan.
- Assessment/diagnosis.
- Plan/rencana.
- Tindakan.
- Biaya tindakan.
- Catatan dokter.

Setelah rekam medis dan resep selesai, kunjungan dapat otomatis masuk status READY_TO_PAY.

### 5.10 Prescriptions

Resep dibuat berdasarkan kunjungan.

Fitur:

- Pilih obat.
- Input jumlah.
- Aturan pakai.
- Catatan.
- Harga obat dihitung dari data medicine.
- Total biaya obat masuk ke invoice.
- Resep tampil di portal pasien.

### 5.11 Medicine Stock

Fitur stok obat:

- Tambah obat.
- Edit obat.
- Hapus obat.
- Stok minimum.
- Harga satuan.
- Satuan obat.
- Log perubahan stok.
- Alert stok rendah.

### 5.12 Cashier & Payment

Payment dibuat dengan flow klinik yang lebih realistis.

Alur:

```text
Payment Flow
|
|-- Dokter/operasional selesai input rekam medis dan resep
|   `-- Sistem mengubah status kunjungan menjadi READY_TO_PAY
|
|-- Kasir membuka /payments
|   `-- Sistem menampilkan list kunjungan dengan status READY_TO_PAY
|
|-- Kasir memilih salah satu kunjungan
|   `-- Sistem membuat preview tagihan otomatis
|       |-- Biaya konsultasi dari visits/polyclinics
|       |-- Biaya obat dari prescriptions
|       `-- Biaya tindakan dari medical_records
|
|-- Kasir melengkapi transaksi
|   |-- Input diskon jika ada
|   |-- Pilih metode bayar
|   |-- Input jumlah dibayar jika cash
|   `-- Klik Proses Pembayaran
|
|-- Sistem memproses pembayaran
|   |-- Status kunjungan menjadi PAID
|   |-- Invoice otomatis terbuat
|   `-- Invoice tampil di portal pasien
|
`-- Pasien membuka portal pasien
    `-- Pasien dapat melihat status invoice dan detail pembayaran
```

Metode pembayaran:

- Cash.
- Transfer.
- Bayar di tempat.

Catatan: BPJS dihapus dari prototype karena sistem tidak memakai fitur BPJS.

Invoice:

- Nomor invoice otomatis.
- Nama pasien.
- Nomor kunjungan.
- Poli.
- Dokter.
- Item tagihan.
- Diskon.
- Total.
- Jumlah dibayar.
- Kembalian jika cash.
- Status pembayaran.
- Tanggal transaksi.

Print invoice harus mencetak format invoice, bukan seluruh halaman website.

### 5.13 Notifications

Notifikasi bersifat realtime.

Fitur:

- Notifikasi masuk tanpa refresh.
- Tipe notifikasi dibedakan warna.
- Hapus satu notifikasi.
- Clear semua notifikasi.
- Notifikasi admin berbeda dari notifikasi operasional.
- Notifikasi pasien hanya untuk pasien terkait.

Tipe notifikasi:

- Info.
- Success.
- Warning.
- Error.
- Operasional.
- Sistem.

### 5.14 Patient Portal

Portal pasien memiliki tampilan berbeda dari dashboard dokter. Portal dibuat seperti halaman personal modern, ringan, dan fokus ke data pasien sendiri.

Tab utama:

- Home.
- Visits.
- Medical Records.
- Prescriptions.
- Payments.

Profile tidak ditampilkan sebagai tab utama. Profile diakses dari menu akun kanan atas.

Home portal pasien:

- Pengumuman publik.
- Edukasi kesehatan.
- Ringkasan kunjungan.
- Ringkasan resep.
- Ringkasan invoice.
- Jadwal selanjutnya.
- CTA konsultasi atau jadwal kunjungan.

Visits:

- Riwayat kunjungan pasien.
- Poli.
- Dokter.
- Status.
- Tanggal.

Medical Records:

- Rekam medis milik pasien.
- Hanya data pasien login.

Prescriptions:

- Resep milik pasien.
- Obat dan aturan pakai.

Payments:

- Invoice pasien.
- Status pembayaran.
- Detail tagihan.
- Opsi bayar langsung atau bayar di tempat sesuai konfigurasi.

Footer portal pasien:

- Privacy Policy.
- Activity History.
- Clinic Info.
- Copyright.

Footer harus menempel di bawah halaman saat konten pendek.

## 6. Struktur Data Utama

Struktur data utama dibuat dalam bentuk tree berdasarkan domain modul.

```text
Database
|
|-- Identity & Access
|   |-- users
|   |   |-- role
|   |   |-- email
|   |   |-- password_hash
|   |   `-- is_active
|   |
|   |-- roles
|   `-- permissions
|
|-- Master Data Klinik
|   |-- patients
|   |   |-- medical_record_no
|   |   |-- user_id (opsional untuk portal pasien)
|   |   |-- name
|   |   |-- nik
|   |   |-- gender
|   |   |-- birth_date
|   |   |-- phone
|   |   |-- address
|   |   |-- blood_type
|   |   `-- allergy_notes
|   |
|   |-- doctors
|   |-- nurses
|   |-- staff
|   |-- polyclinics
|   |   |-- code
|   |   |-- queue_prefix
|   |   `-- consultation_fee
|   |
|   `-- doctor_schedules
|
|-- Pelayanan Klinik
|   |-- visits
|   |   |-- patient_id
|   |   |-- doctor_id
|   |   |-- polyclinic_id
|   |   |-- complaint
|   |   |-- status
|   |   `-- visit_date
|   |
|   |-- queues
|   |   |-- visit_id
|   |   |-- patient_id
|   |   |-- polyclinic_id
|   |   |-- queue_number
|   |   |-- sequence
|   |   `-- status
|   |
|   |-- vital_signs
|   |-- medical_records
|   |   |-- visit_id
|   |   |-- doctor_id
|   |   |-- diagnosis
|   |   |-- treatment
|   |   `-- treatment_fee
|   |
|   |-- prescriptions
|   `-- prescription_items
|
|-- Farmasi
|   |-- medicines
|   |   |-- code
|   |   |-- name
|   |   |-- unit
|   |   |-- price
|   |   |-- stock
|   |   `-- min_stock
|   |
|   `-- medicine_stock_logs
|
|-- Keuangan
|   |-- payments
|   |   |-- visit_id
|   |   |-- invoice_no
|   |   |-- subtotal
|   |   |-- discount
|   |   |-- total
|   |   |-- paid_amount
|   |   |-- change_amount
|   |   |-- method
|   |   `-- status
|   |
|   `-- payment_details
|
|-- CMS & Komunikasi
|   |-- site_settings
|   |-- portal_announcements
|   `-- notifications
|
`-- Audit
    `-- audit_logs
```

Relasi penting dalam sistem:

```text
users
|-- dapat memiliki role
`-- dapat terhubung ke patients jika role pasien

patients
`-- visits
    |-- polyclinics
    |-- doctors
    |-- queues
    |-- vital_signs
    |-- medical_records
    |-- prescriptions
    |   `-- prescription_items
    |       `-- medicines
    |
    `-- payments
        `-- payment_details

site_settings
`-- dipakai landing page, portal pasien, footer, logo, tema, dan konten publik

audit_logs
`-- mencatat aktivitas penting user dan sistem
```

## 7. API Flow Utama

```text
API
|
|-- /api/v1/auth
|   |-- POST /login                  Login semua role
|   |-- POST /register-patient       Register akun pasien
|   |-- POST /refresh-token          Refresh access token
|   |-- POST /logout                 Logout user
|   `-- GET  /me                     Ambil user login saat ini
|
|-- /api/v1/settings
|   |-- GET /site                    Ambil konfigurasi CMS publik
|   |-- PUT /site                    Simpan konfigurasi CMS
|   `-- GET /monitoring              Monitoring admin
|
|-- /api/v1/patients
|   |-- GET    /                     List pasien dengan search dan pagination
|   |-- POST   /                     Tambah pasien
|   |-- GET    /:id                  Detail pasien
|   |-- PUT    /:id                  Edit pasien
|   `-- DELETE /:id                  Hapus pasien
|
|-- /api/v1/visits
|   |-- GET  /                       List kunjungan
|   |-- POST /                       Buat kunjungan
|   `-- PUT  /:id                    Update kunjungan
|
|-- /api/v1/queues
|   |-- GET  /                       List antrian
|   |-- POST /                       Buat antrian
|   |-- POST /:id/call               Panggil antrian
|   |-- POST /:id/recall             Panggil ulang antrian
|   |-- POST /:id/skip               Lewati antrian
|   `-- POST /:id/complete           Selesaikan antrian
|
|-- /api/v1/clinical
|   |-- /vital-signs
|   |   |-- GET  /                   List vital sign
|   |   `-- POST /                   Tambah vital sign
|   |
|   |-- /medical-records
|   |   |-- GET  /                   List rekam medis
|   |   `-- POST /                   Tambah rekam medis
|   |
|   `-- /prescriptions
|       |-- GET  /                   List resep
|       `-- POST /                   Tambah resep
|
|-- /api/v1/payments
|   |-- GET  /                       List pembayaran
|   |-- GET  /ready-to-pay           List kunjungan siap bayar
|   |-- GET  /:visitId/billing-preview
|   |                                  Preview tagihan otomatis
|   |-- POST /process                Proses pembayaran
|   `-- GET  /:id/invoice            Detail invoice
|
`-- /api/v1/notifications
    |-- GET    /                     List notifikasi user
    |-- POST   /                     Buat notifikasi
    |-- DELETE /:id                  Hapus satu notifikasi
    `-- DELETE /                     Hapus semua notifikasi
```

## 8. Realtime Design

Realtime menggunakan Socket.IO.

Channel utama:

- queue:updated
- queue:called
- notification:new
- notification:deleted
- notification:cleared
- cms:updated
- payment:updated

Contoh:

```text
Admin save CMS
      |
      v
Backend update site_settings
      |
      v
Socket emit cms:updated
      |
      v
Landing page dan portal pasien update tanpa refresh
```

```text
Kasir proses pembayaran
      |
      v
Backend create invoice
      |
      v
Socket emit payment:updated
      |
      v
Portal pasien menerima invoice terbaru
```

## 9. Security

Keamanan yang digunakan:

- Password hashing.
- JWT access token.
- Refresh token.
- RBAC authorization.
- Helmet.
- Rate limiting.
- Input validation.
- Zod validation.
- Prisma ORM untuk mencegah SQL injection.
- Sanitasi request body.
- Audit logs.
- Secrets disimpan di `.env`.
- Admin tidak diberi akses default ke data medis operasional.
- Pasien hanya dapat melihat data miliknya sendiri.

Prinsip akses data:

- Admin mengelola sistem, bukan data medis harian.
- Operasional mengelola pelayanan klinik.
- Pasien hanya melihat data sendiri.

## 10. Performance

Optimasi yang diterapkan:

- Lazy loading komponen berat.
- Dynamic import Socket.IO client.
- Realtime socket tidak langsung aktif di semua halaman.
- Pagination server-side.
- Search dengan debounce.
- Optimasi query database.
- Index database untuk field penting.
- Bundle optimization.
- Optimized lucide-react import.
- Scroll listener ditrottle dengan requestAnimationFrame.
- CSS animation dibuat ringan.
- Content visibility untuk area besar.
- Menghindari rerender yang tidak perlu.

Target performa:

- LCP rendah.
- CLS stabil.
- INP lebih responsif.
- Tidak ada animasi berat yang mengganggu input.

## 11. UI/UX System

Tema visual terbaru:

- Warna utama tidak lagi biru dominan.
- Menggunakan soft sage, warm cream, muted gray, dan lavender highlight.
- Card tactile dengan shadow lembut.
- Button lebih lembut dan modern.
- Sidebar responsive dengan collapse animation.
- Modal form memakai blur full screen.
- Date chooser modern.
- Footer responsive.
- Landing page full screen.
- Patient portal berbeda dari dashboard operasional.

Prinsip desain:

- Data padat tetap mudah dibaca.
- Table kompleks tetap punya aksi jelas.
- Form muncul setelah user klik button tambah/edit.
- Mobile memakai layout adaptif.
- Sidebar tidak memotong konten.
- Teks harus kontras dan terbaca.

## 12. Status Implementasi Prototype

| Area | Status | Catatan |
| --- | --- | --- |
| Authentication | Sudah ada | Login semua role dalam satu halaman |
| Register pasien | Sudah ada | Untuk portal pasien |
| Register staff/admin | Sudah ada | Admin membuat akun operasional |
| RBAC | Sudah ada | Admin, operasional, pasien dipisah |
| Dashboard admin | Sudah ada | Fokus CMS dan monitoring |
| Dashboard operasional | Sudah ada | Data nyata dari backend |
| Patient management | Sudah ada | Tambah, edit, hapus/nonaktif |
| Visit registration | Sudah ada | Perlu penyempurnaan detail billing |
| Queue realtime | Sudah ada | Dengan voice calling |
| Vital signs | Sudah ada | Form dan tabel |
| Medical records | Sudah ada | Dokter otomatis dari akun login |
| Prescriptions | Sudah ada | Terhubung ke visit |
| Medicine stock | Sudah ada | Stok dan harga obat |
| Payment/invoice | Sudah ada sebagian | Flow READY_TO_PAY perlu terus dirapikan |
| Notifications | Sudah ada | Realtime, clear, delete |
| Patient portal | Sudah ada | Data pasien sendiri |
| CMS settings | Sudah ada | Preview, upload image, realtime update |
| Audit logs | Sudah ada | Hanya admin |
| Landing page | Sudah ada | CMS-driven |
| Footer | Sudah ada | Public dan portal pasien |

## 13. Alur Pengujian Local

1. Jalankan PostgreSQL.
2. Pastikan `.env` backend berisi `DATABASE_URL`.
3. Masuk folder backend.
4. Jalankan migration dan seed jika diperlukan.
5. Jalankan backend.
6. Masuk folder frontend.
7. Jalankan frontend.
8. Buka landing page.
9. Login sebagai admin.
10. Ubah CMS dan simpan.
11. Cek landing page dan portal pasien berubah tanpa refresh.
12. Login sebagai operasional.
13. Input pasien.
14. Buat kunjungan.
15. Panggil antrian.
16. Input vital sign.
17. Input rekam medis dan resep.
18. Proses pembayaran.
19. Login sebagai pasien.
20. Cek rekam medis, resep, dan invoice pasien.

## 14. Catatan Pengembangan Lanjutan

Prioritas berikutnya:

- Memperkuat flow READY_TO_PAY sampai invoice final.
- Membuat print invoice khusus dengan template resmi.
- Menambahkan pembayaran online bila diperlukan.
- Menambahkan export laporan.
- Menambahkan dashboard monitoring lebih lengkap.
- Menambahkan riwayat perubahan CMS.
- Menambahkan permission granular jika role perlu dibuat lebih detail.
- Menambahkan test automated untuk auth, RBAC, billing, dan patient portal.

## 15. Kesimpulan

Prototype ini sudah membentuk fondasi aplikasi rekam medis klinik modern dengan pembagian role yang lebih jelas:

- Admin sebagai pengelola sistem dan CMS.
- Operasional sebagai pengguna pelayanan klinik.
- Pasien sebagai pemilik akses data pribadi.

Dengan arsitektur modular, validasi backend, RBAC, realtime update, CMS, dan portal pasien, sistem ini siap dijadikan project akhir/portfolio yang terlihat serius, realistis, dan masih mudah dikembangkan.
