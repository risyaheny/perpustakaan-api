import { ApiProperty } from '@nestjs/swagger';

/**
 * Bentuk respons error seragam (dihasilkan HttpExceptionFilter).
 */
export class ErrorResponseDto {
  @ApiProperty({ example: 400, description: 'Kode status HTTP' })
  statusCode: number;

  @ApiProperty({ example: 'Bad Request', description: 'Nama status HTTP' })
  error: string;

  @ApiProperty({
    example: 'title wajib diisi',
    description: 'Pesan error (string; validasi array diratakan)',
  })
  message: string;

  @ApiProperty({ example: '/books', description: 'Path request' })
  path: string;

  @ApiProperty({
    example: '2026-11-08T16:01:11.897Z',
    description: 'Waktu error (ISO 8601)',
  })
  timestamp: string;
}
