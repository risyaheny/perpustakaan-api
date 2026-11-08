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
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { BooksService } from './books.service';
import { BookResponseDto } from './dto/book-response.dto';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';

/**
 * Endpoint HTTP untuk buku. Semua status code dan body diproses
 * di sini; logika bisnis ada di BooksService.
 */
@ApiTags('books')
@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tambah satu buku' })
  @ApiBody({ type: CreateBookDto })
  @ApiResponse({
    status: 201,
    description: 'Buku berhasil dibuat',
    type: BookResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Body tidak valid', type: ErrorResponseDto })
  @ApiResponse({ status: 409, description: 'ISBN duplikat', type: ErrorResponseDto })
  create(@Body() dto: CreateBookDto) {
    return this.booksService.create(dto);
  }

  // Didefinisikan sebelum /books/:id agar path "bulk" tidak ditangkap sebagai :id.
  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Tambah banyak buku dalam satu transaksi (atomik)',
    description:
      'Semua berhasil → commit (201). Satu gagal (mis. ISBN duplikat) → rollback total (409).',
  })
  @ApiBody({ type: [CreateBookDto], description: 'Array buku' })
  @ApiResponse({
    status: 201,
    description: 'Semua buku tersimpan',
    type: [BookResponseDto],
  })
  @ApiResponse({
    status: 400,
    description: 'Elemen array/body tidak valid',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'ISBN duplikat → rollback seluruh batch',
    type: ErrorResponseDto,
  })
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

  @Get()
  @ApiOperation({ summary: 'Ambil seluruh daftar buku' })
  @ApiResponse({
    status: 200,
    description: 'Daftar buku',
    type: [BookResponseDto],
  })
  findAll() {
    return this.booksService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ambil detail satu buku' })
  @ApiParam({ name: 'id', type: Number, example: 1, description: 'ID buku' })
  @ApiResponse({ status: 200, description: 'Detail buku', type: BookResponseDto })
  @ApiResponse({ status: 400, description: 'Id tidak valid (bukan angka)', type: ErrorResponseDto })
  @ApiResponse({ status: 404, description: 'Buku tidak ditemukan', type: ErrorResponseDto })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.booksService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Ganti seluruh data buku' })
  @ApiParam({ name: 'id', type: Number, example: 1, description: 'ID buku' })
  @ApiBody({ type: CreateBookDto })
  @ApiResponse({ status: 200, description: 'Buku diperbarui', type: BookResponseDto })
  @ApiResponse({ status: 400, description: 'Id/body tidak valid', type: ErrorResponseDto })
  @ApiResponse({ status: 404, description: 'Buku tidak ditemukan', type: ErrorResponseDto })
  @ApiResponse({ status: 409, description: 'ISBN duplikat', type: ErrorResponseDto })
  replace(@Param('id', ParseIntPipe) id: number, @Body() dto: CreateBookDto) {
    return this.booksService.replace(id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Ubah sebagian field buku' })
  @ApiParam({ name: 'id', type: Number, example: 1, description: 'ID buku' })
  @ApiBody({ type: UpdateBookDto })
  @ApiResponse({ status: 200, description: 'Buku diperbarui', type: BookResponseDto })
  @ApiResponse({ status: 400, description: 'Id/body tidak valid', type: ErrorResponseDto })
  @ApiResponse({ status: 404, description: 'Buku tidak ditemukan', type: ErrorResponseDto })
  @ApiResponse({ status: 409, description: 'ISBN duplikat', type: ErrorResponseDto })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBookDto) {
    return this.booksService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Hapus buku' })
  @ApiParam({ name: 'id', type: Number, example: 1, description: 'ID buku' })
  @ApiResponse({ status: 204, description: 'Buku dihapus (tanpa body)' })
  @ApiResponse({ status: 400, description: 'Id tidak valid', type: ErrorResponseDto })
  @ApiResponse({ status: 404, description: 'Buku tidak ditemukan', type: ErrorResponseDto })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.booksService.remove(id);
  }
}
