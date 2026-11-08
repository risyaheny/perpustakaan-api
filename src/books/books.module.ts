import { Module } from '@nestjs/common';
import { BooksController } from './books.controller';
import { BooksRepository } from './books.repository';
import { BooksService } from './books.service';

/**
 * Modul books: mengatur sendiri controller + provider-nya.
 * Daftarkan ke AppModule supaya endpoint /books aktif.
 */
@Module({
  controllers: [BooksController],
  providers: [BooksService, BooksRepository],
})
export class BooksModule {}
