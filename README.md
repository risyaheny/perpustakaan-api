# Sistem Perpustakaan API

REST API modul **books** (Sistem Perpustakaan) berbasis **NestJS** + TypeScript, terhubung ke **PostgreSQL** melalui **TypeORM** (`synchronize: false`, skema via migration). Menyediakan CRUD, `POST /books/bulk` transaksional (commit/rollback), validasi DTO, error seragam, serta dokumentasi OpenAPI.

## Dokumentasi & bukti
- Spesifikasi OpenAPI: [`openapi.yaml`](openapi.yaml)
- Swagger UI (saat server berjalan): `http://localhost:3000/api/docs`
- Matriks pengujian: [`docs/matriks-pengujian.md`](docs/matriks-pengujian.md)
- Laporan: [`docs/laporan.md`](docs/laporan.md)
- Hasil Newman: [`docs/hasil-newman.txt`](docs/hasil-newman.txt)
- Bukti database & transaksi: [`docs/bukti-database.md`](docs/bukti-database.md)
- Postman (Newman): [`postman/perpustakaan-api.postman_collection.json`](postman/perpustakaan-api.postman_collection.json)

## Fitur utama
- **Database**: PostgreSQL + TypeORM, perubahan skema lewat migration.
- **Validasi**: global `ValidationPipe` (`whitelist` + `transform`, `class-validator`). `title`/`author`/`isbn` wajib; `year` 1000–2100; `stock`/`available` ≥ 0. `:id` divalidasi `ParseIntPipe`.
- **Error seragam** (global `HttpExceptionFilter`): `{ statusCode, error, message, path, timestamp }` untuk 400/404/409/dll.
- **409 Conflict**: `UNIQUE` PostgreSQL (ISBN duplikat, kode `23505`) → 409.
- **Transaksi bulk**: `POST /books/bulk` atomik (satu gagal → rollback seluruh batch).

## Struktur folder (ringkas)
```
src/
├── main.ts                         # bootstrap + ValidationPipe + HttpExceptionFilter + Swagger /api/docs
├── app.module.ts                   # ConfigModule + TypeOrmModule.forRootAsync
├── data-source.ts                  # DataSource CLI TypeORM (migration)
├── common/filters/http-exception.filter.ts
├── common/dto/error-response.dto.ts
├── migrations/1794150511860-CreateBooks.ts
└── books/
    ├── books.controller.ts         # endpoint /books (+ /books/bulk)
    ├── books.service.ts            # logika bisnis (NotFoundException)
    ├── books.repository.ts         # TypeORM: CRUD + createBulk (transaksi, 23505→409)
    ├── entities/book.entity.ts
    └── dto/ (create|update|book-response)
scripts/export-openapi.ts           # ekspor openapi.yaml (tanpa listen)
```

## Setup database
Prasyarat: PostgreSQL berjalan (contoh `localhost:5432`). `psql` (Windows): `C:\Program Files\PostgreSQL\18\bin\psql.exe`.

1. **Buat database** `perpustakaan` dan `perpustakaan_test` (sekali):
   ```powershell
   & "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -h localhost -c "CREATE DATABASE perpustakaan;"
   & "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -h localhost -c "CREATE DATABASE perpustakaan_test;"
   ```
2. **Salin konfigurasi env** dari contoh, lalu isi nilainya (jangan commit `.env`/`.env.test`):
   ```powershell
   Copy-Item .env.example .env
   ```
   Variabel: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`. (Suite test memakai `.env.test` dengan `DB_NAME=perpustakaan_test`.)
3. **Pasang dependency & jalankan migration** (membuat tabel `books` + seed):
   ```bash
   npm install
   npm run migration:run
   ```

## Menjalankan aplikasi
```bash
npm run start:dev    # watch (development) — http://localhost:3000
npm run build        # kompilasi ke dist/
npm run start:prod   # jalankan hasil build
```
Swagger UI: `http://localhost:3000/api/docs`.

## Daftar endpoint
| Method | URL | Fungsi | Sukses | Gagal |
|---|---|---|---:|---|
| `POST` | `/books` | Tambah satu buku | 201 | 400, 409 |
| `POST` | `/books/bulk` | Tambah banyak buku (transaksi atomik) | 201 | 400, 409 (rollback batch) |
| `GET` | `/books` | Daftar buku | 200 | — |
| `GET` | `/books/:id` | Detail buku | 200 | 400, 404 |
| `PUT` | `/books/:id` | Ganti seluruh data | 200 | 400, 404, 409 |
| `PATCH` | `/books/:id` | Ubah sebagian field | 200 | 400, 404, 409 |
| `DELETE` | `/books/:id` | Hapus buku | 204 | 400, 404 |

> Error berformat `{ statusCode, error, message, path, timestamp }`. Detail/contoh: [`docs/bukti-database.md`](docs/bukti-database.md).

## Menjalankan test
Semua perintah test (kecuali Newman) **tanpa server port 3000**. Integration/E2E hanya memakai `perpustakaan_test` (tidak menyentuh `perpustakaan`).

| Perintah | Jenis | Keterangan |
|---|---|---|
| `npm test` | Unit | `src/**/*.spec.ts` (Jest, repo di-mock). |
| `npm run test:integration` | Integration | `test/integration/*.integration-spec.ts` — service+repo asli+TypeORM ke `perpustakaan_test` (tanpa HTTP), `--runInBand`. |
| `npm run test:e2e` | E2E | `test/*.e2e-spec.ts` via supertest ke `perpustakaan_test`. |
| `npm run test:cov` | Coverage | Coverage unit (scope `jest.config.ts`). |
| `npm run test:newman` | Newman | Jalankan koleksi `postman/perpustakaan-api.postman_collection.json` terhadap `http://localhost:3000` — **butuh server berjalan** (`npm run start:dev`). |

## Menghasilkan ulang OpenAPI
```bash
npm run openapi:export
```
Menulis [`openapi.yaml`](openapi.yaml) ke root dengan membuat app Nest (tanpa `listen`) lalu menutupnya. Memerlukan koneksi DB sesuai `.env` (TypeORM diinisialisasi), tanpa menyentuh `.env`.
