import { Injectable } from '@nestjs/common';

/** Bentuk data buku — field sama dengan server.js. */
export interface Book {
  id: number;
  title: string;
  author?: string;
  isbn?: string;
  year?: number;
  category?: string;
  stock?: number;
  available?: number;
}

export type CreateBookData = Omit<Book, 'id'>;
export type UpdateBookData = Partial<CreateBookData>;

/**
 * Penyimpanan buku. Saat ini in-memory; kelak diganti implementasi
 * PostgreSQL. Service hanya bergantung pada metode publik di bawah,
 * jadi cukup tukar class ini (atau implements interface yang sama)
 * tanpa mengubah service/controller.
 */
@Injectable()
export class BooksRepository {
  private books: Book[] = [
    {
      id: 1,
      title: 'Pemrograman Algoritma dan Struktur Data',
      author: 'Budi Santoso',
      isbn: '978-602-123-456-7',
      year: 2021,
      category: 'Informatika',
      stock: 5,
      available: 3,
    },
    {
      id: 2,
      title: 'Dasar Algoritma Pemrograman',
      author: 'Ani Wijaya',
      isbn: '978-602-234-567-8',
      year: 2020,
      category: 'Informatika',
      stock: 2,
      available: 0,
    },
  ];

  private nextId = 109;

  findAll(): Book[] {
    return [...this.books];
  }

  findById(id: number): Book | undefined {
    return this.books.find((book) => book.id === id);
  }

  create(data: CreateBookData): Book {
    const book: Book = { id: this.nextId++, ...data };
    this.books.push(book);
    return book;
  }

  /** Ganti seluruh field (PUT), id tetap. */
  save(id: number, data: CreateBookData): Book | undefined {
    const book = this.findById(id);
    if (!book) return undefined;
    Object.assign(book, { id, ...data });
    return book;
  }

  /** Ubah sebagian field (PATCH). */
  merge(id: number, data: UpdateBookData): Book | undefined {
    const book = this.findById(id);
    if (!book) return undefined;
    Object.assign(book, data);
    return book;
  }

  remove(id: number): boolean {
    const index = this.books.findIndex((book) => book.id === id);
    if (index === -1) return false;
    this.books.splice(index, 1);
    return true;
  }
}
