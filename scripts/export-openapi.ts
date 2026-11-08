import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { writeFileSync } from 'fs';
import { stringify } from 'yaml';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

/**
 * Ekspor dokumen OpenAPI ke openapi.yaml di root proyek.
 * Membuat instance Nest (tanpa listen/start server HTTP) lalu menutupnya.
 * Membutuhkan koneksi DB sesuai .env karena AppModule menginisialisasi TypeORM.
 */
async function exportOpenApi(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: false });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('API Perpustakaan')
    .setDescription('Dokumentasi REST API Sistem Perpustakaan (modul books).')
    .setVersion('1.0.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  const yaml = stringify(document);
  writeFileSync('openapi.yaml', yaml, 'utf8');

  await app.close();
  // eslint-disable-next-line no-console
  console.log('openapi.yaml berhasil ditulis');
}

void exportOpenApi();
