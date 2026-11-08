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
          // Repository di-mock: logika in-memory tidak dijalankan,
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

  it('create: mengembalikan buku dengan id', () => {
    const dto = {
      title: 'Buku Baru',
      author: 'Penulis Baru',
      isbn: '978-602-999-000-1',
      year: 2025,
      category: 'Uji',
      stock: 3,
      available: 3,
    };
    repository.create.mockReturnValue({ id: 109, ...dto });

    const result = service.create(dto);

    expect(result.id).toBeDefined();
    expect(result.id).toEqual(expect.any(Number));
    expect(result).toEqual({ id: 109, ...dto });
    expect(repository.create).toHaveBeenCalledWith(dto);
  });

  it('findOne: id yang tidak ada melempar NotFoundException', () => {
    repository.findById.mockReturnValue(undefined);

    expect(() => service.findOne(999)).toThrow(NotFoundException);
    expect(repository.findById).toHaveBeenCalledWith(999);
  });

  it('remove: buku yang ada berhasil dihapus', () => {
    repository.remove.mockReturnValue(true);

    expect(() => service.remove(1)).not.toThrow();
    expect(repository.remove).toHaveBeenCalledWith(1);
  });
});
