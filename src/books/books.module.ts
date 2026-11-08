import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BooksController } from './books.controller';
import { BooksRepository } from './books.repository';
import { BooksService } from './books.service';
import { Book } from './entities/book.entity';

/**
 * Modul books: mengatur sendiri controller + provider-nya.
 * Daftarkan ke AppModule supaya endpoint /books aktif.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Book])],
  controllers: [BooksController],
  providers: [BooksService, BooksRepository],
})
export class BooksModule {}
