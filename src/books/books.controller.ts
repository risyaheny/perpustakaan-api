import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseArrayPipe,
  ParseIntPipe,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { BooksService } from './books.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';

/**
 * Endpoint HTTP untuk buku. Semua status code dan body diproses
 * di sini; logika bisnis ada di BooksService.
 */
@Controller('books')
export class BooksController {
  // Dependency Injection: controller menerima Service lewat constructor.
  // Nest menyuntikkan BooksService (satu-satunya provider yang dibutuhkan
  // di lapisan ini) — controller tidak perlu tahu cara kerja service.
  constructor(private readonly booksService: BooksService) {}

  // POST /books -> 201 Created
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateBookDto) {
    return this.booksService.create(dto);
  }

  // POST /books/bulk -> 201 Created (satu transaksi: semua-atau-tidak-sama-sekali)
  // Didefinisikan sebelum /books/:id agar path "bulk" tidak ditangkap sebagai :id.
  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  createBulk(
    @Body(
      new ParseArrayPipe({
        items: CreateBookDto,
        whitelist: true,
        forbidNonWhitelisted: false,
      }),
    )
    dtos: CreateBookDto[],
  ) {
    return this.booksService.createBulk(dtos);
  }

  // GET /books -> 200
  @Get()
  findAll() {
    return this.booksService.findAll();
  }

  // GET /books/:id -> 200 atau 404
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.booksService.findOne(id);
  }

  // PUT /books/:id -> 200 (ganti seluruh data) atau 404
  @Put(':id')
  replace(@Param('id', ParseIntPipe) id: number, @Body() dto: CreateBookDto) {
    return this.booksService.replace(id, dto);
  }

  // PATCH /books/:id -> 200 (ubah sebagian) atau 404
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBookDto) {
    return this.booksService.update(id, dto);
  }

  // DELETE /books/:id -> 204 No Content (tanpa body) atau 404
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    // Return promise-nya supaya Nest menunggu selesai (atau 404) sebelum merespons.
    return this.booksService.remove(id);
  }
}
