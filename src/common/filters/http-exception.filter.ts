import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Filter global: semua error (HttpException maupun error tak terduga)
 * dikirim dalam format seragam —
 * { statusCode, error, message, path, timestamp }.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const timestamp = new Date().toISOString();
    const path = request.url;

    let statusCode: number;
    let error: string;
    let message: string;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exResponse = exception.getResponse();

      if (typeof exResponse === 'object' && exResponse !== null) {
        const body = exResponse as Record<string, unknown>;
        error =
          typeof body.error === 'string'
            ? body.error
            : this.statusText(statusCode);
        const raw = body.message ?? exception.message;
        // ValidationPipe mengirim message berupa array; diratakan jadi string.
        if (Array.isArray(raw)) {
          message = raw.join('; ');
        } else if (typeof raw === 'string') {
          message = raw;
        } else {
          message = exception.message;
        }
      } else {
        error = this.statusText(statusCode);
        message = String(exResponse);
      }
    } else {
      // Error tak terduga (bug, dll) — jangan bocorkan detail internal.
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      error = this.statusText(statusCode);
      message = 'Terjadi kesalahan pada server';
    }

    response
      .status(statusCode)
      .json({ statusCode, error, message, path, timestamp });
  }

  private statusText(statusCode: number): string {
    return (HttpStatus as unknown as Record<number, string>)[statusCode] ??
      'Error';
  }
}
