import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateBooks1794150511860 implements MigrationInterface {
    name = 'CreateBooks1794150511860'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "books" ("id" SERIAL NOT NULL, "isbn" character varying NOT NULL, "title" character varying NOT NULL, "author" character varying NOT NULL, "year" integer, "category" character varying, "stock" integer NOT NULL DEFAULT '0', "available" integer NOT NULL DEFAULT '1', CONSTRAINT "UQ_54337dc30d9bb2c3fadebc69094" UNIQUE ("isbn"), CONSTRAINT "PK_f3f2f25a099d24e12545b70b022" PRIMARY KEY ("id"))`);
        // Seed dua buku awal — data sama seperti penyimpanan in-memory sebelumnya.
        await queryRunner.query(`INSERT INTO "books" ("id", "title", "author", "isbn", "year", "category", "stock", "available") VALUES
            (1, 'Pemrograman Algoritma dan Struktur Data', 'Budi Santoso', '978-602-123-456-7', 2021, 'Informatika', 5, 3),
            (2, 'Dasar Algoritma Pemrograman', 'Ani Wijaya', '978-602-234-567-8', 2020, 'Informatika', 2, 0)`);
        // Insert explicit tidak menggerakkan sequence; setval(v, false) membuat
        // nextval berikutnya = v, sehingga id baru mulai dari 109 seperti nextId lama.
        await queryRunner.query(`SELECT setval(pg_get_serial_sequence('books', 'id'), 109, false)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "books"`);
    }

}
