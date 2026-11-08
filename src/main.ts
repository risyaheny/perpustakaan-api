import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Validasi global untuk semua request:
  // - whitelist: field yang tidak ada di DTO dibuang dari body
  // - transform: body di-otomatis-convert sesuai tipe data DTO
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Semua error (400/404/409/dll) dibalas dalam format seragam.
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
