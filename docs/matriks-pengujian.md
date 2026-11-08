# Matriks Pengujian — perpustakaan-api

Disusun dari file test yang benar-benar ada (`src/books/books.service.spec.ts`, `test/integration/books.integration-spec.ts`, `test/books.e2e-spec.ts`, `test/books-failure.e2e-spec.ts`, `test/app.e2e-spec.ts`) dan koleksi `postman/perpustakaan-api.postman_collection.json` ("Tugas 7 - Newman"). Tidak ada skenario rekaan. Newman **tidak dijalankan** dalam verifikasi ini (butuh server port 3000) — kolom Hasil Newman = "Belum dijalankan (butuh server)". Kolom Hasil untuk unit/integration/E2E diisi **Lulus** berdasarkan run terakhir: `npm test` (2 suite, 10 lulus), `npm run test:integration` (1 suite, 8 lulus), `npm run test:e2e` (3 suite, 18 lulus).

## Matriks skenario

| ID | Endpoint | Skenario | Kategori | Input | Hasil yang Diharapkan | Jenis Test | File Test | Hasil |
|---|---|---|---|---|---|---|---|---|
| U1 | (service) `create` | Membuat buku mengembalikan buku ber-id | Berhasil | DTO buku valid (repo di-mock → `{id:109,...dto}`) | Objek buku dengan id dikembalikan, `create(dto)` terpanggil | unit | `src/books/books.service.spec.ts` | Lulus |
| U2 | (service) `create` | ISBN duplikat → `ConflictException` | Konflik | DTO (repo di-mock → `reject ConflictException`) | Melempar `ConflictException` | unit | `src/books/books.service.spec.ts` | Lulus |
| U3 | (service) `findAll` | Mengembalikan seluruh buku | Berhasil | (repo di-mock → `[{id:1,...}]`) | Array daftar buku | unit | `src/books/books.service.spec.ts` | Lulus |
| U4 | (service) `findOne` | Buku ada dikembalikan | Berhasil | `id=1` (repo → `{id:1,...}`) | Objek buku `id=1` | unit | `src/books/books.service.spec.ts` | Lulus |
| U5 | (service) `findOne` | Id tidak ada → `NotFoundException` | Data Tidak Ditemukan | `id=999` (repo → `undefined`) | Melempar `NotFoundException` | unit | `src/books/books.service.spec.ts` | Lulus |
| U6 | (service) `update` | Buku diperbarui | Berhasil | `id=1, {title:'Baru'}` (repo → objek terbarui) | Objek dengan `title='Baru'` | unit | `src/books/books.service.spec.ts` | Lulus |
| U7 | (service) `update` | Id tidak ada → `NotFoundException` | Data Tidak Ditemukan | `id=999, {title:'X'}` (repo → `undefined`) | Melempar `NotFoundException` | unit | `src/books/books.service.spec.ts` | Lulus |
| U8 | (service) `remove` | Hapus buku yang ada | Berhasil | `id=1` (repo → `true`) | Selesai tanpa error | unit | `src/books/books.service.spec.ts` | Lulus |
| U9 | (service) `remove` | Id tidak ada → `NotFoundException` | Data Tidak Ditemukan | `id=999` (repo → `false`) | Melempar `NotFoundException` | unit | `src/books/books.service.spec.ts` | Lulus |
| I1 | (service/DB) `create`+`findOne` | Data tersimpan lalu terbaca | Berhasil | `{title,author,isbn:'978-int-001'}` (repo asli, DB test) | `findOne` mengembalikan buku dengan ISBN & judul sama | integration | `test/integration/books.integration-spec.ts` | Lulus |
| I2 | (service/DB) `findAll` | Mengembalikan data yang ada | Berhasil | 2 buku (`978-int-010`,`978-int-011`) | `findAll()` length = 2 | integration | `test/integration/books.integration-spec.ts` | Lulus |
| I3 | (service/DB) `findOne` | Id tidak ada → `NotFoundException` | Data Tidak Ditemukan | `id=99999` (tabel kosong) | Melempar `NotFoundException` | integration | `test/integration/books.integration-spec.ts` | Lulus |
| I4 | (service/DB) `update` | Field berubah & tersimpan | Berhasil | Buat buku, lalu `update(id,{title:'Judul Baru'})` | `title` menjadi `Judul Baru` (terbaca ulang) | integration | `test/integration/books.integration-spec.ts` | Lulus |
| I5 | (service/DB) `remove` | Data terhapus | Berhasil | Buat buku, lalu `remove(id)` | `findOne(id)` berikutnya → `NotFoundException` | integration | `test/integration/books.integration-spec.ts` | Lulus |
| I6 | (service/DB) `create` | ISBN duplikat → `ConflictException` (23505) | Konflik | Buat `isbn:'978-int-dup'`, lalu buat lagi ISBN sama | Melempar `ConflictException` | integration | `test/integration/books.integration-spec.ts` | Lulus |
| I7 | (service/DB) `createBulk` | Semua tersimpan (commit) | Berhasil | `[isbn:'978-int-bulk-1','978-int-bulk-2']` | 2 baris tersimpan, `findAll()` length = 2 | integration | `test/integration/books.integration-spec.ts` | Lulus |
| I8 | (service/DB) `createBulk` | ISBN duplikat dalam batch → rollback total | Konflik | `[isbn:'978-int-rb-1','978-int-rb-1']` | Melempar `ConflictException` & `findAll()` length = 0 (bukti rollback) | integration | `test/integration/books.integration-spec.ts` | Lulus |
| E1 | `POST /books` | Membuat buku valid | Berhasil | Body buku valid `isbn:'978-e2e-c1'` | 201, body berisi `id`, `title`, `isbn` | E2E | `test/books.e2e-spec.ts` | Lulus |
| E2 | `GET /books` | Ambil daftar buku | Berhasil | (1 buku disiapkan) | 200, body array (≥1) | E2E | `test/books.e2e-spec.ts` | Lulus |
| E3 | `GET /books/{id}` | Ambil detail buku | Berhasil | `id` hasil POST | 200, `body.id` sesuai | E2E | `test/books.e2e-spec.ts` | Lulus |
| E4 | `GET /books/{id}` | Id tidak ada | Data Tidak Ditemukan | `/books/99999` | 404 | E2E | `test/books.e2e-spec.ts` | Lulus |
| E5 | `GET /books/{id}` | Id tidak valid (bukan angka) | Validasi Gagal | `/books/abc` | 400 | E2E | `test/books.e2e-spec.ts` | Lulus |
| E6 | `PUT /books/{id}` | Ganti seluruh data | Berhasil | `id` hasil POST, body penuh `title:'Judul PUT'` | 200, `title='Judul PUT'` | E2E | `test/books.e2e-spec.ts` | Lulus |
| E7 | `PATCH /books/{id}` | Ubah sebagian field | Berhasil | `id` hasil POST, body `{title:'Judul PATCH'}` | 200, `title` berubah, `isbn` tetap | E2E | `test/books.e2e-spec.ts` | Lulus |
| E8 | `DELETE /books/{id}` | Hapus buku | Berhasil | `id` hasil POST | 204, lalu GET id sama → 404 | E2E | `test/books.e2e-spec.ts` | Lulus |
| E9 | `POST /books` | ISBN duplikat | Konflik | POST ISBN `978-e2e-dup` dua kali | POST kedua → 409, `error:'Conflict'` | E2E | `test/books.e2e-spec.ts` | Lulus |
| E10 | `POST /books` | Title kosong | Validasi Gagal | `{title:'', author:'A', isbn:'978-e2e-bad'}` | 400 | E2E | `test/books.e2e-spec.ts` | Lulus |
| E11 | `POST /books/bulk` | Bulk sukses (commit) | Berhasil | `[isbn:'978-e2e-b1','978-e2e-b2']` | 201, array length 2 | E2E | `test/books.e2e-spec.ts` | Lulus |
| E12 | `POST /books/bulk` | ISBN duplikat dalam batch → rollback | Konflik | `[isbn:'978-e2e-rb1','978-e2e-rb1']` | 409 `Conflict` & tabel `books` length 0 (rollback) | E2E | `test/books.e2e-spec.ts` | Lulus |
| F1 | `POST /books` | Title kosong (format error seragam) | Validasi Gagal | `{title:'', author:'Penulis', isbn:'978-1-000'}` | 400 `Bad Request`, message berisi `title wajib diisi`, punya `path`/`timestamp` | E2E | `test/books-failure.e2e-spec.ts` | Lulus |
| F2 | `GET /books/{id}` | Id tidak valid (ParseIntPipe) | Validasi Gagal | `/books/abc` | 400 `Bad Request` | E2E | `test/books-failure.e2e-spec.ts` | Lulus |
| F3 | `GET /books/{id}` | Data tidak ditemukan | Data Tidak Ditemukan | `/books/99999` | 404 `Not Found`, path `/books/99999`, message berisi `99999` | E2E | `test/books-failure.e2e-spec.ts` | Lulus |
| F4 | `POST /books` | ISBN sudah ada | Konflik | Buat `isbn:'978-409-0001'`, lalu POST ISBN sama | 409 `Conflict`, message ISBN, path `/books` | E2E | `test/books-failure.e2e-spec.ts` | Lulus |
| F5 | `POST /books/bulk` | Satu ISBN duplikat → rollback total | Konflik | `[isbn:'978-bulk-rb-1','978-bulk-rb-1']` | 409 `Conflict` path `/books/bulk` & `find()` length 0 (bukti rollback) | E2E | `test/books-failure.e2e-spec.ts` | Lulus |
| N1 | `POST /books` | Buat buku valid, simpan id | Berhasil | `{title,author,isbn={{isbn1}} acak,year,category,stock,available}` | 201, ada `id` (disimpan ke var), `isbn` sesuai | Newman | `postman/perpustakaan-api.postman_collection.json` | Belum dijalankan (butuh server) |
| N2 | `GET /books` | Daftar buku | Berhasil | — | 200, body array | Newman | `postman/perpustakaan-api.postman_collection.json` | Belum dijalankan (butuh server) |
| N3 | `GET /books/{id}` | Detail buku | Berhasil | `/books/{{book_id}}` | 200, `id` = `book_id` | Newman | `postman/perpustakaan-api.postman_collection.json` | Belum dijalankan (butuh server) |
| N4 | `PUT /books/{id}` | Ganti seluruh data | Berhasil | `/books/{{book_id}}`, body penuh `title:'Buku Newman (PUT)'` | 200, data terganti (title/author/isbn) | Newman | `postman/perpustakaan-api.postman_collection.json` | Belum dijalankan (butuh server) |
| N5 | `PATCH /books/{id}` | Ubah sebagian field | Berhasil | `/books/{{book_id}}`, `{title:'Buku Newman (PATCH)'}` | 200, `title` berubah, field lain (`author`) tetap | Newman | `postman/perpustakaan-api.postman_collection.json` | Belum dijalankan (butuh server) |
| N6 | `POST /books/bulk` | Bulk 2 buku ISBN acak | Berhasil | 2 item, ISBN acak (`{{bulkIsbn1,2}}`) | 201, array length 2 ber-id | Newman | `postman/perpustakaan-api.postman_collection.json` | Belum dijalankan (butuh server) |
| N7 | `POST /books` | Title kosong | Validasi Gagal | `{title:'', author:'Penulis', isbn:'978-invalid-title'}` | 400, format error (`statusCode,error,message,path,timestamp`) | Newman | `postman/perpustakaan-api.postman_collection.json` | Belum dijalankan (butuh server) |
| N8 | `GET /books/{id}` | Id tidak valid | Validasi Gagal | `/books/abc` | 400, `statusCode=400` | Newman | `postman/perpustakaan-api.postman_collection.json` | Belum dijalankan (butuh server) |
| N9 | `GET /books/{id}` | Id tidak ditemukan | Data Tidak Ditemukan | `/books/999999` | 404, `Not Found` | Newman | `postman/perpustakaan-api.postman_collection.json` | Belum dijalankan (butuh server) |
| N10 | `POST /books` | ISBN sama dengan request 1 | Konflik | `{..., isbn:'{{isbn1}}'}` | 409 `Conflict`, message berisi ISBN | Newman | `postman/perpustakaan-api.postman_collection.json` | Belum dijalankan (butuh server) |
| N11 | `POST /books/bulk` | ISBN baru + duplikat (req.1) → rollback | Konflik | `[ {isbn:'{{bulkNewIsbn}}'}, {isbn:'{{isbn1}}'} ]` | 409 `Conflict` | Newman | `postman/perpustakaan-api.postman_collection.json` | Belum dijalankan (butuh server) |
| N12 | `DELETE /books/{id}` | Hapus buku | Berhasil | `/books/{{book_id}}` | 204 No Content | Newman | `postman/perpustakaan-api.postman_collection.json` | Belum dijalankan (butuh server) |

> Cakupan 7 endpoint (`GET/POST/PUT/PATCH/DELETE /books/{id}`, `GET/POST /books`, `POST /books/bulk`) dan keempat kategori (Berhasil, Validasi Gagal, Data Tidak Ditemukan, Konflik) terpenuhi. (`test/app.e2e-spec.ts` — `GET /` 200 — bukan endpoint `/books`, tidak dimasukkan ke tabel utama; tetap lulus di suite e2e.)

## Ringkasan

### Jumlah skenario per kategori

| Kategori | unit | integration | E2E | Newman | Total |
|---|---:|---:|---:|---:|---:|
| Berhasil | 5 | 5 | 7 | 7 | 24 |
| Validasi Gagal | 0 | 0 | 4 | 2 | 6 |
| Data Tidak Ditemukan | 3 | 1 | 2 | 1 | 7 |
| Konflik | 1 | 2 | 4 | 2 | 9 |
| **Total** | **9** | **8** | **17** | **12** | **46** |

### Jumlah skenario per jenis test

| Jenis Test | File | Jumlah skenario matriks | Hasil run terakhir |
|---|---|---:|---|
| unit | `src/books/books.service.spec.ts` | 9 | 10 lulus (bersama `app.controller.spec.ts`), 2 suite lulus — `npm test` |
| integration | `test/integration/books.integration-spec.ts` | 8 | 8 lulus, 1 suite lulus — `npm run test:integration` |
| E2E | `test/books.e2e-spec.ts` (12) + `test/books-failure.e2e-spec.ts` (5) | 17 | 18 lulus (termasuk `app.e2e-spec.ts`), 3 suite lulus — `npm run test:e2e` |
| Newman | `postman/perpustakaan-api.postman_collection.json` | 12 | Belum dijalankan (butuh server port 3000) |
| **Total** | | **46** | |
