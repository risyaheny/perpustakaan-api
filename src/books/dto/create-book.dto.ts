import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

/**
 * DTO untuk POST /books dan PUT /books/:id (replace penuh).
 * title, author, isbn wajib dan tidak kosong — selaras dengan constraint
 * NOT NULL di tabel books. Field lain opsional dengan batas wajar.
 */
export class CreateBookDto {
  @IsString()
  @IsNotEmpty({ message: 'title wajib diisi' })
  title: string;

  @IsString()
  @IsNotEmpty({ message: 'author wajib diisi' })
  author: string;

  @IsString()
  @IsNotEmpty({ message: 'isbn wajib diisi' })
  isbn: string;

  @IsOptional()
  @IsInt()
  @Min(1000, { message: 'year minimal 1000' })
  @Max(2100, { message: 'year maksimal 2100' })
  year?: number;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsInt()
  @Min(0, { message: 'stock minimal 0' })
  stock?: number;

  @IsOptional()
  @IsInt()
  @Min(0, { message: 'available minimal 0' })
  available?: number;
}
