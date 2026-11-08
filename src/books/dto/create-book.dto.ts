import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

/**
 * DTO untuk POST /books dan PUT /books/:id (replace penuh).
 * title, author, isbn wajib dan tidak kosong — selaras dengan constraint
 * NOT NULL di tabel books. Field lain opsional dengan batas wajar.
 */
export class CreateBookDto {
  @ApiProperty({ example: 'Laskar Pelangi', description: 'Judul buku (wajib)' })
  @IsString()
  @IsNotEmpty({ message: 'title wajib diisi' })
  title: string;

  @ApiProperty({ example: 'Andrea Hirata', description: 'Penulis (wajib)' })
  @IsString()
  @IsNotEmpty({ message: 'author wajib diisi' })
  author: string;

  @ApiProperty({ example: '978-979-3062-79-2', description: 'ISBN unik (wajib)' })
  @IsString()
  @IsNotEmpty({ message: 'isbn wajib diisi' })
  isbn: string;

  @ApiPropertyOptional({
    example: 2005,
    minimum: 1000,
    maximum: 2100,
    description: 'Tahun terbit',
  })
  @IsOptional()
  @IsInt()
  @Min(1000, { message: 'year minimal 1000' })
  @Max(2100, { message: 'year maksimal 2100' })
  year?: number;

  @ApiPropertyOptional({ example: 'Fiksi', description: 'Kategori' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 5, minimum: 0, description: 'Stok (≥ 0)' })
  @IsOptional()
  @IsInt()
  @Min(0, { message: 'stock minimal 0' })
  stock?: number;

  @ApiPropertyOptional({ example: 3, minimum: 0, description: 'Tersedia (≥ 0)' })
  @IsOptional()
  @IsInt()
  @Min(0, { message: 'available minimal 0' })
  available?: number;
}
