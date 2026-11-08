import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Book } from './books/entities/book.entity';

/**
 * DataSource untuk CLI TypeORM (migration:generate/run/revert).
 * Dipakai di luar Nest, jadi konfigurasi DB dibaca langsung dari env.
 */
export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [Book],
  migrations: ['src/migrations/*.{ts,js}'],
  synchronize: false,
});
