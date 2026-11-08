import { ConflictException, NotFoundException } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BooksRepository } from '../../src/books/books.repository';
import { BooksService } from '../../src/books/books.service';
import { Book } from '../../src/books/entities/book.entity';

/**
 * Integration test (tanpa HTTP): BooksService + BooksRepository ASLI +
 * TypeORM ke database perpustakaan_test (dari .env.test). Migrasi dijalankan,
 * tabel books dibersihkan sebelum tiap test. Tidak pernah menyentuh DB perpustakaan.
 */
describe('BooksService integration (perpustakaan_test)', () => {
  let moduleRef: TestingModule;
  let service: BooksService;
  let dataSource: DataSource;

  const base = (isbn: string) => ({
    title: 'Buku Integrasi',
    author: 'Penulis',
    isbn,
  });

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: ['.env.test', '.env'],
        }),
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (config: ConfigService) => ({
            type: 'postgres' as const,
            host: config.get('DB_HOST'),
            port: Number(config.get('DB_PORT')),
            username: config.get('DB_USER'),
            password: config.get('DB_PASSWORD'),
            database: config.get('DB_NAME'),
            entities: [Book],
            migrations: ['src/migrations/*.{ts,js}'],
            migrationsRun: true,
            synchronize: false,
          }),
        }),
        TypeOrmModule.forFeature([Book]),
      ],
      providers: [BooksService, BooksRepository],
    }).compile();

    service = moduleRef.get(BooksService);
    dataSource = moduleRef.get(DataSource);
  });

  beforeEach(async () => {
    await dataSource.query('TRUNCATE TABLE "books" RESTART IDENTITY CASCADE');
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('create lalu findOne: data tersimpan dan terbaca', async () => {
    const created = await service.create(base('978-int-001'));
    expect(created.id).toBeDefined();
    const found = await service.findOne(created.id);
    expect(found.isbn).toBe('978-int-001');
    expect(found.title).toBe('Buku Integrasi');
  });

  it('findAll: mengembalikan data yang ada', async () => {
    await service.create(base('978-int-010'));
    await service.create(base('978-int-011'));
    const all = await service.findAll();
    expect(all).toHaveLength(2);
  });

  it('findOne: id tidak ada -> NotFoundException', async () => {
    await expect(service.findOne(99999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('update: field berubah dan tersimpan', async () => {
    const created = await service.create(base('978-int-020'));
    const updated = await service.update(created.id, { title: 'Judul Baru' });
    expect(updated.title).toBe('Judul Baru');
    const found = await service.findOne(created.id);
    expect(found.title).toBe('Judul Baru');
  });

  it('remove: data terhapus', async () => {
    const created = await service.create(base('978-int-030'));
    await service.remove(created.id);
    await expect(service.findOne(created.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('ISBN duplikat -> ConflictException (23505)', async () => {
    await service.create(base('978-int-dup'));
    await expect(service.create(base('978-int-dup'))).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('createBulk sukses: semua tersimpan (commit)', async () => {
    const rows = await service.createBulk([
      base('978-int-bulk-1'),
      base('978-int-bulk-2'),
    ]);
    expect(rows).toHaveLength(2);
    expect(await service.findAll()).toHaveLength(2);
  });

  it('createBulk dengan ISBN duplikat -> ConflictException & rollback (tidak ada yang tersimpan)', async () => {
    await expect(
      service.createBulk([base('978-int-rb-1'), base('978-int-rb-1')]),
    ).rejects.toBeInstanceOf(ConflictException);
    // bukti rollback: tabel tetap kosong
    expect(await service.findAll()).toHaveLength(0);
  });
});
