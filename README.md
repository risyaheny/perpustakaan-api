# Sistem Perpustakaan API

REST API untuk Sistem Perpustakaan yang dibangun dengan **NestJS** dan TypeScript. Proyek ini menyediakan modul **`books`** — operasi CRUD lengkap untuk data buku (`id`, `title`, `author`, `isbn`, `year`, `category`, `stock`, `available`). Saat ini data disimpan **in-memory** lewat repository yang terisolasi, sehingga nanti bisa diganti ke PostgreSQL tanpa mengubah controller maupun service. Validasi body memakai `class-validator` + `class-transformer` yang dipasang sebagai `ValidationPipe` global.

## Struktur Folder `src/books`

```
src/
├── main.ts                 # bootstrap + ValidationPipe global (whitelist, transform)
├── app.module.ts           # mendaftarkan BooksModule
└── books/
    ├── books.module.ts     # deklarasi controller & provider modul books
    ├── books.controller.ts # lapisan HTTP (endpoint /books)
    ├── books.service.ts    # logika bisnis
    ├── books.repository.ts # penyimpanan in-memory (interface Book)
    └── dto/
        ├── create-book.dto.ts   # DTO untuk POST & PUT
        └── update-book.dto.ts   # DTO untuk PATCH
```

| File | Fungsi |
|------|--------|
| `books.module.ts` | Modul yang mengikat `BooksController`, `BooksService`, dan `BooksRepository`. Didaftarkan di `AppModule` agar endpoint `/books` aktif. |
| `books.controller.ts` | Menerima request HTTP (`POST`, `GET`, `PUT`, `PATCH`, `DELETE`), mem-parsing param & body (termasuk `ParseIntPipe` untuk `:id`), lalu memanggil service. Mengembalikan status 201 (POST), 200, 204 (DELETE). |
| `books.service.ts` | Logika bisnis: membuat, mencari, mengganti, menghapus buku. Melempar `NotFoundException` bila buku tidak ditemukan (otomatis jadi respons 404). |
| `books.repository.ts` | Penyimpanan in-memory (array + seed buku id 1 & 2, `nextId = 109`). Class terpisah yang di-inject ke service — kelak tinggal diganti implementasi PostgreSQL dengan antarmuka metode yang sama. |
| `dto/create-book.dto.ts` | `CreateBookDto` untuk POST/PUT. Hanya `title` wajib (`@IsString` + `@IsNotEmpty`); field lain opsional dengan validasi tipe (`year`, `stock`, `available` harus integer ≥ 0). |
| `dto/update-book.dto.ts` | `UpdateBookDto` untuk PATCH, dibuat dengan `PartialType(CreateBookDto)` sehingga semua field menjadi opsional. |

## Instalasi dan Menjalankan

```bash
npm install          # pasang dependency (termasuk class-validator, class-transformer)
npm run start:dev    # jalankan dalam mode watch (development)
```

Aplikasi berjalan di `http://localhost:3000`. Perintah lain:

```bash
npm run build        # kompilasi ke dist/
npm start            # jalankan sekali tanpa watch
npm run start:prod   # jalankan hasil build untuk produksi
```

## Daftar Endpoint

| Method | URL | Fungsi | Status Sukses | Status Gagal |
|--------|-----|--------|---------------|--------------|
| `POST` | `/books` | Tambah buku baru | `201 Created` | `400` (body tanpa `title` / tipe salah) |
| `GET` | `/books` | Ambil seluruh daftar buku | `200 OK` | — |
| `GET` | `/books/:id` | Ambil detail satu buku | `200 OK` | `404` (tidak ada), `400` (`:id` bukan angka) |
| `PUT` | `/books/:id` | Ganti seluruh data buku | `200 OK` | `400`, `404` |
| `PATCH` | `/books/:id` | Ubah sebagian field buku | `200 OK` | `400`, `404` |
| `DELETE` | `/books/:id` | Hapus buku | `204 No Content` | `404` |

## Contoh Request & Response

### POST `/books` — 201 Created

```bash
curl -X POST http://localhost:3000/books \
  -H "Content-Type: application/json" \
  -d '{"title":"Buku Baru","author":"Penulis","isbn":"978-602-111-222-3","year":2025,"category":"Informatika","stock":1,"available":1}'
```

```json
{
  "id": 109,
  "title": "Buku Baru",
  "author": "Penulis",
  "isbn": "978-602-111-222-3",
  "year": 2025,
  "category": "Informatika",
  "stock": 1,
  "available": 1
}
```

### POST `/books` tanpa `title` — 400 Bad Request

```bash
curl -X POST http://localhost:3000/books \
  -H "Content-Type: application/json" \
  -d '{"author":"Penulis Tanpa Judul"}'
```

```json
{
  "message": ["title wajib diisi", "title must be a string"],
  "error": "Bad Request",
  "statusCode": 400
}
```

### GET `/books/999` — 404 Not Found

```bash
curl http://localhost:3000/books/999
```

```json
{
  "message": "Buku dengan id 999 tidak ditemukan",
  "error": "Not Found",
  "statusCode": 404
}
```

## Menjalankan Test

```bash
npm test              # unit test (Jest): src/**/*.spec.ts
npm run test:e2e      # E2E test (Jest + supertest): test/*.e2e-spec.ts
```

- **Unit test** — `src/books/books.service.spec.ts` menguji service dengan `BooksRepository` yang di-mock: create mengembalikan buku ber-id, `findOne` id tak ada melempar `NotFoundException`, dan remove berhasil.
- **E2E test** — `test/books.e2e-spec.ts` membuat instance aplikasi sendiri lewat supertest (tanpa membuka port 3000) dan memasang `ValidationPipe` yang sama seperti `main.ts`: POST valid → 201, POST tanpa `title` → 400, GET `/books/999` → 404, GET `/books` → 200 berupa array.

## Dependency Injection

Modul ini memperlihatkan alur dependency injection khas NestJS dari lapisan ke lapisan: `BooksController` menerima `BooksService` lewat constructor, dan `BooksService` menerima `BooksRepository` lewat constructor — NestJS yang membuat instance tiap provider (terdaftar di `books.module.ts`) lalu menyuntikkannya, sehingga tidak ada pemanggilan `new` di kode aplikasi. Controller hanya tahu soal HTTP, service hanya tahu soal logika bisnis, dan repository hanya tahu soal penyimpanan; konsekuensinya, mengganti penyimpanan in-memory ke PostgreSQL cukup dengan menukar implementasi `BooksRepository` di module tanpa mengubah satu baris pun pada controller atau service.

## Bukti Pengujian

| Bukti | Lokasi |
|-------|--------|
| Postman Collection (8 request CRUD, v2.1) | [`postman/crud.postman_collection.json`](postman/crud.postman_collection.json) |
| Screenshot 8 request Postman | `screenshot/crud-01-get-daftar-200.png` … `screenshot/crud-08-post-400.png` |
| Screenshot hasil unit test | `screenshot/hasil-test-unit.png` |
| Screenshot hasil E2E test | `screenshot/hasil-test-e2e.png` |
| Screenshot struktur project | `screenshot/struktur-project.png` |

Cara pakai collection: jalankan server (`npm run start:dev`), lalu import `postman/crud.postman_collection.json` ke Postman — variabel collection `base_url` sudah di-set ke `http://localhost:3000`.
