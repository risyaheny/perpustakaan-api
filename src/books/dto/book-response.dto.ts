import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Skema respons satu entitas Book (sesuai tabel books). */
export class BookResponseDto {
  @ApiProperty({ example: 1, description: 'ID buku (primary key)' })
  id: number;

  @ApiProperty({ example: '978-602-123-456-7', description: 'ISBN (unik)' })
  isbn: string;

  @ApiProperty({
    example: 'Pemrograman Algoritma dan Struktur Data',
    description: 'Judul buku',
  })
  title: string;

  @ApiProperty({ example: 'Budi Santoso', description: 'Penulis' })
  author: string;

  @ApiPropertyOptional({ example: 2021, nullable: true, description: 'Tahun terbit' })
  year?: number | null;

  @ApiPropertyOptional({
    example: 'Informatika',
    nullable: true,
    description: 'Kategori',
  })
  category?: string | null;

  @ApiProperty({ example: 5, description: 'Jumlah stok (default 0)' })
  stock: number;

  @ApiProperty({ example: 3, description: 'Jumlah tersedia (default 1)' })
  available: number;
}
