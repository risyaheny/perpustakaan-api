import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { Book } from '../src/books/entities/book.entity';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

describe('Books endpoints (e2e, supertest)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  const base = (over: Record<string, unknown> = {}) => ({
    title: 'Buku Uji',
    author: 'Penguji',
    isbn: `978-e2e-${Date.now()}-${Math.random()}`,
    year: 2024,
    category: 'Uji',
    stock: 1,
    available: 1,
    ...over,
  });

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
    dataSource = app.get(DataSource);
  });

  beforeEach(async () => {
    await dataSource.query('TRUNCATE TABLE "books" RESTART IDENTITY CASCADE');
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /books -> 201', async () => {
    const res = await request(app.getHttpServer())
      .post('/books')
      .send(base({ isbn: '978-e2e-c1' }))
      .expect(201);
    expect(res.body).toMatchObject({ title: 'Buku Uji', isbn: '978-e2e-c1' });
    expect(res.body).toHaveProperty('id');
  });

  it('GET /books -> 200 array', async () => {
    await request(app.getHttpServer()).post('/books').send(base());
    const res = await request(app.getHttpServer()).get('/books').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it('GET /books/:id -> 200', async () => {
    const created = await request(app.getHttpServer())
      .post('/books')
      .send(base({ isbn: '978-e2e-g1' }));
    const id = created.body.id;
    const res = await request(app.getHttpServer())
      .get(`/books/${id}`)
      .expect(200);
    expect(res.body.id).toBe(id);
  });

  it('GET /books/:id tidak ada -> 404', async () => {
    await request(app.getHttpServer()).get('/books/99999').expect(404);
  });

  it('GET /books/abc (id tidak valid) -> 400', async () => {
    await request(app.getHttpServer()).get('/books/abc').expect(400);
  });

  it('PUT /books/:id -> 200', async () => {
    const created = await request(app.getHttpServer())
      .post('/books')
      .send(base({ isbn: '978-e2e-put1' }));
    const id = created.body.id;
    const res = await request(app.getHttpServer())
      .put(`/books/${id}`)
      .send(base({ isbn: '978-e2e-put1', title: 'Judul PUT' }))
      .expect(200);
    expect(res.body.title).toBe('Judul PUT');
  });

  it('PATCH /books/:id -> 200', async () => {
    const created = await request(app.getHttpServer())
      .post('/books')
      .send(base({ isbn: '978-e2e-patch1' }));
    const id = created.body.id;
    const res = await request(app.getHttpServer())
      .patch(`/books/${id}`)
      .send({ title: 'Judul PATCH' })
      .expect(200);
    expect(res.body.title).toBe('Judul PATCH');
    expect(res.body.isbn).toBe('978-e2e-patch1');
  });

  it('DELETE /books/:id -> 204', async () => {
    const created = await request(app.getHttpServer())
      .post('/books')
      .send(base({ isbn: '978-e2e-del1' }));
    await request(app.getHttpServer())
      .delete(`/books/${created.body.id}`)
      .expect(204);
    await request(app.getHttpServer())
      .get(`/books/${created.body.id}`)
      .expect(404);
  });

  it('POST /books ISBN duplikat -> 409', async () => {
    await request(app.getHttpServer())
      .post('/books')
      .send(base({ isbn: '978-e2e-dup' }))
      .expect(201);
    const res = await request(app.getHttpServer())
      .post('/books')
      .send(base({ isbn: '978-e2e-dup' }))
      .expect(409);
    expect(res.body.error).toBe('Conflict');
  });

  it('POST /books title kosong -> 400', async () => {
    await request(app.getHttpServer())
      .post('/books')
      .send({ title: '', author: 'A', isbn: '978-e2e-bad' })
      .expect(400);
  });

  it('POST /books/bulk sukses -> 201 (commit)', async () => {
    const res = await request(app.getHttpServer())
      .post('/books/bulk')
      .send([base({ isbn: '978-e2e-b1' }), base({ isbn: '978-e2e-b2' })])
      .expect(201);
    expect(res.body).toHaveLength(2);
  });

  it('POST /books/bulk duplikat -> 409 & rollback (tidak ada yang tersimpan)', async () => {
    const res = await request(app.getHttpServer())
      .post('/books/bulk')
      .send([
        base({ isbn: '978-e2e-rb1' }),
        base({ isbn: '978-e2e-rb1' }),
      ])
      .expect(409);
    expect(res.body.error).toBe('Conflict');
    const rows = await dataSource.getRepository(Book).find();
    expect(rows).toHaveLength(0);
  });
});
