import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BooksService } from './books.service';
import { BooksRepository } from './books.repository';

describe('BooksService', () => {
  let service: BooksService;
  let repository: jest.Mocked<BooksRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BooksService,
        {
          // Repository di-mock: koneksi database tidak dijalankan,
          // kita hanya memverifikasi interaksi service <-> repository
          // dan perilaku (throw NotFoundException, dsb).
          provide: BooksRepository,
          useValue: {
            findAll: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            merge: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<BooksService>(BooksService);
    repository = module.get<jest.Mocked<BooksRepository>>(BooksRepository);
  });

  it('create: mengembalikan buku dengan id', async () => {
    const dto = {
      title: 'Buku Baru',
      author: 'Penulis Baru',
      isbn: '978-602-999-000-1',
      year: 2025,
      category: 'Uji',
      stock: 3,
      available: 3,
    };
    repository.create.mockResolvedValue({ id: 109, ...dto });

    const result = await service.create(dto);

    expect(result.id).toBeDefined();
    expect(result.id).toEqual(expect.any(Number));
    expect(result).toEqual({ id: 109, ...dto });
    expect(repository.create).toHaveBeenCalledWith(dto);
  });

  it('findOne: id yang tidak ada melempar NotFoundException', async () => {
    repository.findById.mockResolvedValue(undefined);

    await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    expect(repository.findById).toHaveBeenCalledWith(999);
  });

  it('remove: buku yang ada berhasil dihapus', async () => {
    repository.remove.mockResolvedValue(true);

    await expect(service.remove(1)).resolves.toBeUndefined();
    expect(repository.remove).toHaveBeenCalledWith(1);
  });
});
