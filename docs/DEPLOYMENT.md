# Panduan Deploy MedRecord

Target deploy gratis yang disarankan:

```text
AplikasiRekamMedis
├── frontend  -> Vercel
└── backend   -> Railway
    └── PostgreSQL -> Railway PostgreSQL
```

## 1. Persiapan Repository

Project ini belum menjadi Git repository. Mulai dari sini:

```bash
git init
git add .
git commit -m "Initial clinic EMR app"
```

Lalu buat repository baru di GitHub dan push project ke sana.

## 2. Deploy Database PostgreSQL di Railway

1. Buka Railway.
2. Buat project baru.
3. Tambahkan service `PostgreSQL`.
4. Salin `DATABASE_URL` dari tab Variables PostgreSQL.

Gunakan URL ini untuk backend.

## 3. Deploy Backend di Railway

Buat service baru dari GitHub repository yang sama, lalu atur:

```text
Root Directory : backend
Build Command  : npm install && npm run build
Start Command  : npm run prisma:deploy && npm run start
```

Environment variables backend:

```env
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://...
JWT_ACCESS_SECRET=isi-dengan-secret-minimal-32-karakter
JWT_REFRESH_SECRET=isi-dengan-secret-minimal-32-karakter
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN_DAYS=7
FRONTEND_URL=https://domain-frontend-vercel.vercel.app
```

Setelah deploy backend berhasil, jalankan seed satu kali di Railway shell:

```bash
npm run seed
```

Akun admin awal:

```text
Email    : admin@klinik.local
Password : Admin12345
```

Ganti password setelah login pertama.

## 4. Deploy Frontend di Vercel

Import GitHub repository yang sama ke Vercel, lalu atur:

```text
Root Directory : frontend
Build Command  : npm run build
Output         : .next
```

Environment variables frontend:

```env
NEXT_PUBLIC_API_URL=https://domain-backend-railway.up.railway.app/api/v1
NEXT_PUBLIC_SOCKET_URL=https://domain-backend-railway.up.railway.app
```

Setelah frontend punya domain Vercel, kembali ke Railway dan update:

```env
FRONTEND_URL=https://domain-frontend-vercel.vercel.app
```

Redeploy backend setelah mengganti `FRONTEND_URL`.

## 5. Urutan Test Setelah Deploy

```text
1. Buka /health backend
   └── harus muncul success true

2. Buka frontend Vercel
   └── landing page tampil normal

3. Login admin
   └── admin@klinik.local / Admin12345

4. Buat akun dokter/staff
   └── cek menu sesuai role

5. Register pasien
   └── pasien otomatis masuk data pasien

6. Buat kunjungan
   └── cek antrian realtime

7. Input rekam medis + resep
   └── status kunjungan menjadi ready_to_pay

8. Proses pembayaran di kasir
   └── invoice muncul di portal pasien

9. Update CMS admin
   └── logo/nama/footer berubah realtime
```

## 6. Catatan Penting

- Jangan pakai `prisma migrate dev` di server production.
- Gunakan `npm run prisma:deploy` untuk Railway.
- Jangan commit `.env`.
- Untuk upload gambar CMS, storage lokal Railway bersifat tidak permanen. Jika nanti fitur upload gambar ingin aman untuk production, gunakan storage eksternal seperti Cloudinary, Supabase Storage, atau UploadThing.
- Free tier bisa tidur otomatis. Kalau API lambat saat pertama dibuka, biasanya backend sedang cold start.
