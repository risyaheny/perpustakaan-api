# Sistem Perpustakaan API

REST API untuk Sistem Perpustakaan yang dibangun dengan **NestJS** dan TypeScript, terhubung ke **PostgreSQL** melalui **TypeORM**. Modul `books` menyediakan operasi CRUD, endpoint `POST /books/bulk` (satu transaksi database), validasi DTO, serta penanganan error terformat seragam.

> Detail bukti (struktur tabel/constraint, migration, contoh error 400/404/409, transaksi bulk, dan ringkasan test) ada di [`docs/bukti-database.md`](docs/bukti-database.md).

## Fitur utama

- **Database**: PostgreSQL + TypeORM, `synchronize: false`, perubahan skema lewat migration.
- **Validasi**: `class-validator` + `class-transformer` (global `ValidationPipe`, `whitelist` + `transform`). `title`, `author`, `isbn` wajib; `year` integer berbatas wajar; `stock`/`available` integer ≥ 0. `:id` divalidasi `ParseIntPipe`.
- **Error seragam** (global `HttpExceptionFilter`): `{ statusCode, error, message, path, timestamp }` untuk 400/404/409/dll.
- **409 Conflict**: pelanggaran `UNIQUE` PostgreSQL (ISBN duplikat, kode `23505`) dipetakan ke 409.
- **Transaksi bulk**: `POST /books/bulk` menyimpan array buku secara atomik (semua berhasil → commit, satu gagal → rollback).

## Struktur folder (ringkas)

```
src/
├── main.ts                         # bootstrap + ValidationPipe + HttpExceptionFilter global
├── app.module.ts                   # ConfigModule + TypeOrmModule.forRootAsync
├── data-source.ts                  # DataSource CLI TypeORM (migration)
├── common/filters/
│   └── http-exception.filter.ts    # format error seragam
├── migrations/
│   └── 1794150511860-CreateBooks.ts
└── books/
    ├── books.module.ts
    ├── books.controller.ts         # endpoint /books (+ /books/bulk)
    ├── books.service.ts            # logika bisnis (NotFoundException)
    ├── books.repository.ts         # TypeORM: CRUD + createBulk (transaksi, 23505→409)
    ├── entities/book.entity.ts     # entity/tabel books
    └── dto/
        ├── create-book.dto.ts      # DTO POST & PUT
        └── update-book.dto.ts      # DTO PATCH (PartialType)
```

## Setup database

Prasyarat: PostgreSQL berjalan (contoh lokal `localhost:5432`). Path `psql` di Windows: `C:\Program Files\PostgreSQL\18\bin\psql.exe`.

1. **Buat database** `perpustakaan` dan `perpustakaan_test` (sekali):
   ```powershell
   & "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -h localhost -c "CREATE DATABASE perpustakaan;"
   & "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -h localhost -c "CREATE DATABASE perpustakaan_test;"
   ```
2. **Salin konfigurasi env** dari contoh, lalu isi nilainya (jangan commit `.env`/`.env.test`):
   ```powershell
   Copy-Item .env.example .env
   # opsional, untuk suite test: salin/isi .env.test dengan DB_NAME=perpustakaan_test
   ```
   Variabel: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`.
3. **Pasang dependency & jalankan migration** (membuat tabel `books` + seed):
   ```bash
   npm install
   npm run migration:run
   ```
   (Untuk database test: set `DB_NAME=perpustakaan_test` lalu `npm run migration:run`, atau biarkan suite e2e yang memakai `.env.test`.)

## Menjalankan aplikasi

```bash
npm run start:dev    # mode watch (development) — http://localhost:3000
npm run build        # kompilasi ke dist/
npm run start:prod   # jalankan hasil build
```

## Daftar endpoint

| Method | URL | Fungsi | Status sukses | Status gagal |
|---|---|---|---:|---|
| `POST` | `/books` | Tambah satu buku | 201 | 400 (validasi), 409 (ISBN duplikat) |
| `POST` | `/books/bulk` | Tambah banyak buku **dalam satu transaksi** (atomik) | 201 | 400 (validasi elemen), 409 (duplikat → rollback seluruh batch) |
| `GET` | `/books` | Ambil seluruh daftar buku | 200 | — |
| `GET` | `/books/:id` | Ambil detail satu buku | 200 | 400 (`:id` bukan angka), 404 |
| `PUT` | `/books/:id` | Ganti seluruh data buku | 200 | 400, 404, 409 |
| `PATCH` | `/books/:id` | Ubah sebagian field buku | 200 | 400, 404, 409 |
| `DELETE` | `/books/:id` | Hapus buku | 204 | 400, 404 |

> Semua error berformat `{ statusCode, error, message, path, timestamp }`. Contoh respons 400/404/409: lihat [`docs/bukti-database.md`](docs/bukti-database.md#3-contoh-response-400-404-dan-409).

## Menjalankan test

```bash
npm test              # unit test (Jest): src/**/*.spec.ts
npm run test:e2e      # E2E (Jest + supertest): test/*.e2e-spec.ts
```

- **Unit** — `src/books/books.service.spec.ts`: service diuji dengan repository di-mock.
- **E2E** — dijalankan terhadap **`perpustakaan_test`** (dipaksa oleh `test/jest-setup.ts`, `NODE_ENV=test` + `.env.test`; `maxWorkers: 1`). `test/books.e2e-spec.ts` menguji alur CRUD; `test/books-failure.e2e-spec.ts` menguji skenario gagal (400/404/409) dan membuktikan **rollback** `POST /books/bulk` (batch gagal → tidak ada baris tersimpan).

## Bukti pengujian

- Dokumen bukti lengkap: [`docs/bukti-database.md`](docs/bukti-database.md)
- Postman Collection: [`postman/crud.postman_collection.json`](postman/crud.postman_collection.json) (import ke Postman, `base_url` = `http://localhost:3000`, jalankan server lebih dulu)
- Screenshot: folder [`screenshot/`](screenshot/) (CRUD, error 400/404/409, bulk sukses/rollback, hasil test, struktur tabel/migration).
