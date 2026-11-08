import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

/**
 * DTO untuk POST /books dan PUT /books/:id (replace penuh).
 * Field mengikuti server.js: id, title, author, isbn, year, category, stock, available.
 * Hanya `title` yang wajib — sama seperti aturan di server.js.
 */
export class CreateBookDto {
  @IsString()
  @IsNotEmpty({ message: 'title wajib diisi' })
  title: string;

  @IsOptional()
  @IsString()
  author?: string;

  @IsOptional()
  @IsString()
  isbn?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  year?: number;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  available?: number;
}
