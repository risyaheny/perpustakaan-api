# Laporan Pengujian dan Kesiapan — perpustakaan-api

## 1. Ringkasan Aplikasi dan Arsitektur

**perpustakaan-api** adalah REST API modul pengelolaan buku (Sistem Perpustakaan) berbasis **NestJS** (TypeScript) dengan basis data **PostgreSQL** melalui **TypeORM** (`synchronize: false`, skema dikelola lewat migration). Endpoint utama meliputi CRUD `/books` dan `/books/bulk` (penyimpanan atomik).

Arsitektur berlapis:
- **Controller** (`src/books/books.controller.ts`): menerima HTTP, memvalidasi `:id` dengan `ParseIntPipe`, mem-parsing body (termasuk `ParseArrayPipe` untuk bulk), dan mengembalikan status (201/200/204). Terdokumentasi OpenAPI/Swagger (`@ApiTags/Operation/Param/Body/Response`).
- **Service** (`src/books/books.service.ts`): logika bisnis; melempar `NotFoundException` (404) bila data tidak ada.
- **Repository** (`src/books/books.repository.ts`): akses data TypeORM (CRUD) dan `createBulk` dalam satu transaksi `DataSource.transaction`; pelanggaran unik PostgreSQL (kode `23505`, ISBN duplikat) dipetakan menjadi `ConflictException` (409).
- **Entity** (`src/books/entities/book.entity.ts`): pemetaan tabel `books` (PK `id`, `isbn` UNIQUE+NOT NULL, `title`/`author` NOT NULL, `year`/`category` nullable, `stock` default 0, `available` default 1).
- **DTO** (`src/books/dto/create-book.dto.ts`, `update-book.dto.ts` + kelas respons `book-response.dto.ts`, `src/common/dto/error-response.dto.ts`): validasi `class-validator`/`class-transformer` dengan metadata `@ApiProperty` (contoh nilai).
- **Exception Filter global** (`src/common/filters/http-exception.filter.ts`, didaftarkan di `src/main.ts`): menyeragamkan semua error ke `{ statusCode, error, message, path, timestamp }` (400/404/409/dll; validasi array diratakan; error tak terduga → 500 tanpa detail internal).
- **PostgreSQL + migration**: konfigurasi `ConfigModule` + `TypeOrmModule.forRootAsync` (`src/app.module.ts`, `src/data-source.ts`); migration `src/migrations/1794150511860-CreateBooks.ts` membuat tabel+constraint, seed, dan penyesuaian sequence.

Dokumentasi pendukung: `openapi.yaml` (diekspor tanpa menjalankan server), Swagger UI `/api/docs`, bukti database (`docs/bukti-database.md`), dan matriks pengujian (`docs/matriks-pengujian.md`).

## 2. Cara Menjalankan

1. Prasyarat: Node.js dan PostgreSQL (`localhost:5432`). `psql`: `C:\Program Files\PostgreSQL\18\bin\psql.exe`.
2. Buat database (sekali):
   ```powershell
   & "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -h localhost -c "CREATE DATABASE perpustakaan;"
   & "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -h localhost -c "CREATE DATABASE perpustakaan_test;"
   ```
3. Salin konfigurasi: `Copy-Item .env.example .env` lalu isi `DB_HOST/PORT/USER/PASSWORD/NAME` (jangan commit `.env`/`.env.test`).
4. Pasang dependency & migrasi: `npm install` lalu `npm run migration:run`.
5. Jalankan aplikasi: `npm run start:dev` (http://localhost:3000), Swagger UI di `http://localhost:3000/api/docs`.
6. Regenerasi OpenAPI: `npm run openapi:export` (menulis `openapi.yaml`, tanpa `listen`).

## 3. Daftar Fitur

- CRUD buku: `GET/POST /books`, `GET/PUT/PATCH/DELETE /books/{id}` (status 201/200/204/400/404/409 sesuai kondisi).
- `POST /books/bulk`: simpan array buku **transaksional** (commit semua-atau rollback total; rollback terverifikasi saat ISBN duplikat).
- Validasi DTO (`title/author/isbn` wajib, `year` 1000–2100, `stock/available` ≥ 0) dan validasi `:id` numerik.
- Penanganan error seragam (400/404/409) + pemetaan `23505` → 409.
- Dokumentasi OpenAPI 3 (Swagger `/api/docs`, ekspor `openapi.yaml`).
- Pengujian berlapis (unit, integration, E2E, Newman) dengan isolasi database test.

## 4. Ringkasan Hasil Pengujian

Angka berikut dari eksekusi yang baru dijalankan/dokumen hasil yang ada (tidak dikarang):

| Jenis | Perintah / Sumber | Hasil |
|---|---|---|
| Unit | `npm test` | **2** test suite lulus, **10** test lulus, 0 gagal (4.507 s). File: `src/app.controller.spec.ts`, `src/books/books.service.spec.ts`. |
| Integration | `npm run test:integration` (DB `perpustakaan_test`, tanpa HTTP) | **1** suite lulus, **8** test lulus, 0 gagal (4.578 s). File: `test/integration/books.integration-spec.ts`. |
| E2E | `npm run test:e2e` (supertest, DB `perpustakaan_test`) | **3** suite lulus, **18** test lulus, 0 gagal (12.239 s). File: `test/app.e2e-spec.ts`, `test/books.e2e-spec.ts`, `test/books-failure.e2e-spec.ts`. |
| Coverage | `npm run test:cov` (unit, scope `jest.config.ts`) | **2** suite, **10** test lulus. All files: **Stmts 23.87%** (44/184), **Branch 22.5%** (9/40), **Funcs 25%** (11/44), **Lines 21.28%** (39/183). `books.service.ts` 79.16% stmts / 77.27% lines; `books.entity.ts` 100%; controller/repository/filter tercakup terutama oleh integration/E2E (di luar scope `test:cov` unit). |
| Newman | `docs/hasil-newman.txt` (koleksi "Tugas 7 - Newman", `base_url=http://localhost:3000`; dijalankan saat server aktif) | **12** request, **23** assertion — **0 gagal** (iterations 1/0, requests 12/0, test-scripts 12/0, prerequest 3/0, assertions 23/0; durasi 1278 ms; avg 23 ms). |

Ringkasan skenario per kategori/jenis dirinci di `docs/matriks-pengujian.md` (46 skenario matriks: 24 Berhasil, 6 Validasi Gagal, 7 Data Tidak Ditemukan, 9 Konflik).

## 5. Kendala yang Dihadapi dan Solusinya

1. **`Repository.delete({})` ditolak TypeORM (e2e/integration)** — pembersihan tabel dengan kriteria kosong memicu `Empty criteria(s) are not allowed for the delete method`. **Solusi:** ganti dengan `TRUNCATE TABLE "books" RESTART IDENTITY CASCADE` (isolasi data + reset sequence) pada test DB.
2. **Isolasi database test vs produksi** — risiko pengujian menyentuh `perpustakaan`. **Solusi:** `test/jest-setup.ts` memaksa `NODE_ENV=test` dan memuat `.env.test` (`override`, `DB_NAME=perpustakaan_test`), e2e `maxWorkers:1`; integration memuat `.env.test` + `migrationsRun`. DB `perpustakaan` tidak diakses oleh test otomatis.
3. **Pemetaan error database ke respons HTTP** — duplikasi ISBN (unique violation `23505`) perlu jadi 409 dengan format seragam. **Solusi:** tangkap `QueryFailedError` kode `23505` di repository → `ConflictException`; seluruh error diformat `HttpExceptionFilter` (`{statusCode,error,message,path,timestamp}`).
4. **Transaksi bulk (atomik)** — sebagian data boleh tersimpan bila ada kegagalan di tengah batch. **Solusi:** `DataSource.transaction` pada `createBulk`; exception dari callback memicu rollback otomatis, sukses memicu commit (diverifikasi: batch duplikat → 409 dan tabel kosong).

## 6. Penilaian Kesiapan Aplikasi sebelum UTS

Berdasarkan angka di atas, fungsionalitas inti modul books **berjalan dan terverifikasi**: seluruh unit/integration/E2E yang dijalankan **lulus (0 gagal)**, skenario bulk mencakup commit dan pembuktian rollback, penanganan 400/404/409 konsisten, serta Newman (saat server aktif) **0 gagal** (23 assertion). Migrasi/constraint database, validasi DTO, dan dokumentasi OpenAPI/Swagger tersedia.

**Siap digunakan untuk demonstrasi UTS** pada cakupan modul books, dengan catatan: Newman memerlukan server berjalan (`npm run start:dev` + `npm run test:newman`); angka coverage `test:cov` (unit) rendah pada controller/repository/filter karena jalur tersebut terutama dieksekusi oleh integration/E2E (bukan indikator kegagalan fungsional); pengujian otomatis memakai `perpustakaan_test`—pastikan DB test tersedia dan termigrasi.
