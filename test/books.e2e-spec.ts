import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Books (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // ValidationPipe global yang sama seperti di main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    await app.init();
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
        isbn: '978-602-888-222-3',
        year: 2025,
        category: 'Informatika',
        stock: 4,
        available: 4,
      })
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('id');
        expect(res.body.title).toBe('Buku E2E');
        expect(res.body.isbn).toBe('978-602-888-222-3');
      }));

  it('POST /books tanpa title -> 400', () =>
    request(app.getHttpServer())
      .post('/books')
      .send({ author: 'Tanpa Judul', year: 2024 })
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
