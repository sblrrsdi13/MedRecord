# Database Setup

Project ini memakai PostgreSQL dan Prisma.

## Opsi 1: Docker

Jalankan dari root project:

```bash
docker compose up -d postgres
```

Database yang dibuat:

- Host: `localhost`
- Port: `5432`
- Database: `clinic_emr`
- User: `postgres`
- Password: `postgres`

Lanjutkan migrasi:

```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate
npm run seed
```

## Opsi 2: PostgreSQL Lokal

Buka pgAdmin atau psql, lalu buat database:

```sql
CREATE DATABASE clinic_emr;
```

Pastikan `backend/.env` memakai:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/clinic_emr?schema=public"
```

Lanjutkan:

```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate
npm run seed
```

## Seed Login

- Email: `admin@klinik.local`
- Password: `Admin12345`
