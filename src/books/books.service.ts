import { Injectable, NotFoundException } from '@nestjs/common';
import { Book, BooksRepository } from './books.repository';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';

/**
 * Logika bisnis buku. Tidak tahu soal HTTP — controller yang
 * menerjemahkan request/response, repository yang menyimpan data.
 */
@Injectable()
export class BooksService {
  // Dependency Injection: service menerima Repository lewat constructor.
  // Nest akan membuat instance BooksRepository (provider di BooksModule)
  // lalu menyuntikkannya ke sini — tidak ada `new BooksRepository()`.
  constructor(private readonly booksRepository: BooksRepository) {}

  findAll(): Book[] {
    return this.booksRepository.findAll();
  }

  findOne(id: number): Book {
    const book = this.booksRepository.findById(id);
    if (!book) {
      // Melempar NotFoundException -> otomatis jadi respons 404 oleh Nest
      throw new NotFoundException(`Buku dengan id ${id} tidak ditemukan`);
    }
    return book;
  }

  create(dto: CreateBookDto): Book {
    return this.booksRepository.create(dto);
  }

  replace(id: number, dto: CreateBookDto): Book {
    const book = this.booksRepository.save(id, dto);
    if (!book) {
      throw new NotFoundException(`Buku dengan id ${id} tidak ditemukan`);
    }
    return book;
  }

  update(id: number, dto: UpdateBookDto): Book {
    const book = this.booksRepository.merge(id, dto);
    if (!book) {
      throw new NotFoundException(`Buku dengan id ${id} tidak ditemukan`);
    }
    return book;
  }

  remove(id: number): void {
    const removed = this.booksRepository.remove(id);
    if (!removed) {
      throw new NotFoundException(`Buku dengan id ${id} tidak ditemukan`);
    }
  }
}
