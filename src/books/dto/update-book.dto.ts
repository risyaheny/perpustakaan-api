import { PartialType } from '@nestjs/swagger';
import { CreateBookDto } from './create-book.dto';

/**
 * DTO untuk PATCH /books/:id (ubah sebagian).
 * Semua field menjadi opsional, validasi sama dengan CreateBookDto.
 * (PartialType dari @nestjs/swagger agar metadata OpenAPI ikut diwariskan.)
 */
export class UpdateBookDto extends PartialType(CreateBookDto) {}
