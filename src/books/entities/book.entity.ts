import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Tabel `books`. Constraint mengikuti spesifikasi:
 * - id: PRIMARY KEY auto increment
 * - isbn: UNIQUE dan NOT NULL
 * - title, author: NOT NULL
 * - year: integer (opsional)
 * - category: varchar (opsional)
 * - stock: integer DEFAULT 0 NOT NULL
 * - available: integer DEFAULT 1 NOT NULL
 *   (dipilih integer, bukan boolean — lihat keputusan di task integrasi)
 */
@Entity('books')
export class Book {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  isbn: string;

  @Column()
  title: string;

  @Column()
  author: string;

  @Column({ type: 'int', nullable: true })
  year?: number;

  @Column({ type: 'varchar', nullable: true })
  category?: string;

  @Column({ type: 'int', default: 0 })
  stock: number;

  @Column({ type: 'int', default: 1 })
  available: number;
}
