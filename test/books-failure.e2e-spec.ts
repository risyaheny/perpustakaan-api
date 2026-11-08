import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { Book } from '../src/books/entities/book.entity';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

/**
 * E2E skenario gagal — hanya memakai database perpustakaan_test
 * (dipaksa oleh test/jest-setup.ts). Migrasi dijalankan sekali,
 * tabel books dibersihkan sebelum tiap test.
 */
describe('Books failure (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;

  beforeAll(async () => {
    // DataSource khusus migration/cleanup, menunjuk ke DB dari .env.test.
    dataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 5432),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME, // perpustakaan_test (jest-setup)
      entities: [Book],
      migrations: ['src/migrations/*.{ts,js}'],
      synchronize: false,
    });
    await dataSource.initialize();
    await dataSource.runMigrations();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  beforeEach(async () => {
    // Bersihkan tabel books sebelum tiap test (isolasi). RESTART IDENTITY
    // mereset sequence agar id deterministik; CASCADE aman untuk FK.
    await dataSource.query('TRUNCATE TABLE "books" RESTART IDENTITY CASCADE');
  });

  afterAll(async () => {
    await app?.close();
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
  });

  it('1. POST /books dengan title kosong -> 400', async () => {
    const res = await request(app.getHttpServer())
      .post('/books')
      .send({ title: '', author: 'Penulis', isbn: '978-1-000' })
      .expect(400);

    expect(res.body.statusCode).toBe(400);
    expect(res.body.error).toBe('Bad Request');
    expect(String(res.body.message)).toContain('title wajib diisi');
    expect(res.body).toHaveProperty('path', '/books');
    expect(res.body).toHaveProperty('timestamp');
  });

  it('2. GET /books/abc (id tidak valid) -> 400', async () => {
    const res = await request(app.getHttpServer())
      .get('/books/abc')
      .expect(400);

    expect(res.body.statusCode).toBe(400);
    expect(res.body.error).toBe('Bad Request');
  });

  it('3. GET /books/99999 -> 404', async () => {
    const res = await request(app.getHttpServer())
      .get('/books/99999')
      .expect(404);

    expect(res.body).toMatchObject({
      statusCode: 404,
      error: 'Not Found',
      path: '/books/99999',
    });
    expect(res.body.message).toContain('99999');
  });

  it('4. POST /books dengan ISBN yang sudah ada -> 409', async () => {
    const payload = {
      title: 'Buku Asli',
      author: 'A',
      isbn: '978-409-0001',
    };
    await request(app.getHttpServer()).post('/books').send(payload).expect(201);

    const res = await request(app.getHttpServer())
      .post('/books')
      .send({ title: 'Buku Duplikat', author: 'B', isbn: '978-409-0001' })
      .expect(409);

    expect(res.body).toMatchObject({
      statusCode: 409,
      error: 'Conflict',
      message: 'ISBN sudah digunakan oleh buku lain',
      path: '/books',
    });
  });

  it('5. POST /books/bulk dengan satu ISBN duplikat -> 409 & rollback (tidak ada yang tersimpan)', async () => {
    const res = await request(app.getHttpServer())
      .post('/books/bulk')
      .send([
        { title: 'Harus rollback', author: 'R', isbn: '978-bulk-rb-1' },
        { title: 'Duplikat', author: 'R', isbn: '978-bulk-rb-1' }, // duplikat item sebelumnya
      ])
      .expect(409);

    expect(res.body).toMatchObject({
      statusCode: 409,
      error: 'Conflict',
      message: 'ISBN sudah digunakan oleh buku lain',
      path: '/books/bulk',
    });

    // Bukti rollback: batch batal total, tidak ada baris yang tersisa.
    const rows = await dataSource.getRepository(Book).find();
    expect(rows).toHaveLength(0);
  });
});
