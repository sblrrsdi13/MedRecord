# Uploads Policy

Project ini menggunakan Vercel Blob sebagai storage utama untuk file production.

## Production

* File upload production disimpan di Vercel Blob.
* URL file disimpan sebagai referensi di database atau CMS settings.
* Jangan menyimpan file upload production di repository.

## Local Development

* Folder `backend/storage/uploads/` hanya dipakai sebagai placeholder/local development sementara.
* Saat ini folder tersebut hanya berisi `.gitkeep` agar struktur folder tetap terlihat.
* Jika perlu file temporary saat development, gunakan file kecil dan jangan commit file upload user.

## Rekomendasi

* Asset CMS seperti logo, favicon, hero image, dan doctor image tetap memakai Vercel Blob.
* File besar sebaiknya dikompres sebelum upload.
* Pastikan `.gitignore` tetap mencegah file upload user masuk repository.
