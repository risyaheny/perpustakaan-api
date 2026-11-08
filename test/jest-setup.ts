import * as dotenv from 'dotenv';

// Paksa seluruh e2e memakai database test — tidak pernah menyentuh perpustakaan.
process.env.NODE_ENV = 'test';
dotenv.config({ path: '.env.test', override: true });
