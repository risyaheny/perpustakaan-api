import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { Book } from '../src/books/entities/book.entity';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

describe('Books (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();

    // Seed data deterministik (DB test, dipaksa oleh test/jest-setup.ts).
    // Bersihkan + isi 2 baris agar test ini tidak bergantung pada urutan file e2e.
    const ds = app.get(DataSource);
    await ds.query('TRUNCATE TABLE "books" RESTART IDENTITY CASCADE');
    await ds.getRepository(Book).save([
      {
        title: 'Pemrograman Algoritma dan Struktur Data',
        author: 'Budi Santoso',
        isbn: '978-seed-1',
        year: 2021,
        category: 'Informatika',
        stock: 5,
        available: 3,
      },
      {
        title: 'Dasar Algoritma Pemrograman',
        author: 'Ani Wijaya',
        isbn: '978-seed-2',
        year: 2020,
        category: 'Informatika',
        stock: 2,
        available: 0,
      },
    ]);
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /books dengan body valid -> 201', () =>
    request(app.getHttpServer())
      .post('/books')
      .send({
        title: 'Buku E2E',
        author: 'Tester',
        isbn: `978-602-888-222-${Date.now()}`,
        year: 2025,
        category: 'Informatika',
        stock: 4,
        available: 4,
      })
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('id');
        expect(res.body.title).toBe('Buku E2E');
        expect(res.body.isbn).toMatch(/^978-602-888-222-\d+$/);
      }));

  it('POST /books tanpa title -> 400', () =>
    request(app.getHttpServer())
      .post('/books')
      .send({ author: 'Tanpa Judul', isbn: '978-no-title', year: 2024 })
      .expect(400)
      .expect((res) => {
        expect(res.body.statusCode).toBe(400);
      }));

  it('GET /books/999 -> 404', () =>
    request(app.getHttpServer())
      .get('/books/999')
      .expect(404)
      .expect((res) => {
        expect(res.body.statusCode).toBe(404);
      }));

  it('GET /books -> 200 dan berupa array', () =>
    request(app.getHttpServer())
      .get('/books')
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThanOrEqual(2);
        expect(res.body[0]).toHaveProperty('title');
      }));
});
