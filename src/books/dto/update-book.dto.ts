import { PartialType } from '@nestjs/mapped-types';
import { CreateBookDto } from './create-book.dto';

/**
 * DTO untuk PATCH /books/:id (ubah sebagian).
 * Semua field menjadi opsional, validasi sama dengan CreateBookDto.
 */
export class UpdateBookDto extends PartialType(CreateBookDto) {}
