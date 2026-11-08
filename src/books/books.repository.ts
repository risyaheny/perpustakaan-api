import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryFailedError, Repository } from 'typeorm';
import { Book } from './entities/book.entity';

export { Book };

export type CreateBookData = Omit<Partial<Book>, 'id'> & { title: string };
export type UpdateBookData = Partial<CreateBookData>;

/** Kode SQLSTATE PostgreSQL untuk unique_violation. */
const UNIQUE_VIOLATION = '23505';

/**
 * Penyimpanan buku lewat TypeORM (PostgreSQL). Nama metode dan
 * perilakunya sama seperti versi in-memory — Service dan Controller
 * tidak perlu diubah selain mengikuti sifat async dari database.
 */
@Injectable()
export class BooksRepository {
  constructor(
    @InjectRepository(Book)
    private readonly books: Repository<Book>,
    private readonly dataSource: DataSource,
  ) {}

  findAll(): Promise<Book[]> {
    return this.books.find();
  }

  async findById(id: number): Promise<Book | undefined> {
    const book = await this.books.findOne({ where: { id } });
    return book ?? undefined;
  }

  async create(data: CreateBookData): Promise<Book> {
    const book = this.books.create(data);
    return this.persist(book);
  }

  /** Ganti seluruh field (PUT), id tetap. */
  async save(id: number, data: CreateBookData): Promise<Book | undefined> {
    const book = await this.books.findOne({ where: { id } });
    if (!book) return undefined;
    Object.assign(book, { id, ...data });
    return this.persist(book);
  }

  /** Ubah sebagian field (PATCH). */
  async merge(id: number, data: UpdateBookData): Promise<Book | undefined> {
    const book = await this.books.findOne({ where: { id } });
    if (!book) return undefined;
    Object.assign(book, data);
    return this.persist(book);
  }

  async remove(id: number): Promise<boolean> {
    const result = await this.books.delete(id);
    return (result.affected ?? 0) > 0;
  }

  /** Simpan banyak buku dalam satu transaksi: semua berhasil → commit, satu gagal → rollback. */
  async createBulk(data: CreateBookData[]): Promise<Book[]> {
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(Book);
      const saved: Book[] = [];
      try {
        for (const item of data) {
          const book = repo.create(item);
          saved.push(await repo.save(book));
        }
      } catch (error) {
        if (error instanceof QueryFailedError) {
          const code = (error.driverError as { code?: string } | undefined)
            ?.code;
          if (code === UNIQUE_VIOLATION) {
            // TITIK ROLLBACK (otomatis): exception dilempar dari callback
            // transaksi → TypeORM melakukan ROLLBACK, tidak ada satu pun
            // buku dari batch ini yang tersimpan.
            throw new ConflictException('ISBN sudah digunakan oleh buku lain');
          }
        }
        // TITIK ROLLBACK (otomatis): error lain juga memicu ROLLBACK oleh TypeORM.
        throw error;
      }
      // TITIK COMMIT (otomatis): callback selesai tanpa error → TypeORM
      // melakukan COMMIT, seluruh buku batch tersimpan secara atomik.
      return saved;
    });
  }

  /** Simpan ke DB; unique violation (mis. isbn kembar) jadi 409 Conflict. */
  private async persist(book: Book): Promise<Book> {
    try {
      return await this.books.save(book);
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const code = (error.driverError as { code?: string } | undefined)
          ?.code;
        if (code === UNIQUE_VIOLATION) {
          throw new ConflictException('ISBN sudah digunakan oleh buku lain');
        }
      }
      throw error;
    }
  }
}
