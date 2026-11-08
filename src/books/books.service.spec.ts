import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BooksService } from './books.service';
import { BooksRepository } from './books.repository';

describe('BooksService', () => {
  let service: BooksService;
  let repository: jest.Mocked<BooksRepository>;

  const dto = {
    title: 'Buku Baru',
    author: 'Penulis Baru',
    isbn: '978-602-999-000-1',
    year: 2025,
    category: 'Uji',
    stock: 3,
    available: 3,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BooksService,
        {
          // Repository di-mock: koneksi database tidak dijalankan.
          provide: BooksRepository,
          useValue: {
            findAll: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            merge: jest.fn(),
            remove: jest.fn(),
            createBulk: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<BooksService>(BooksService);
    repository = module.get<jest.Mocked<BooksRepository>>(BooksRepository);
  });

  it('create: mengembalikan buku dengan id', async () => {
    repository.create.mockResolvedValue({ id: 109, ...dto });
    const result = await service.create(dto);
    expect(result).toEqual({ id: 109, ...dto });
    expect(repository.create).toHaveBeenCalledWith(dto);
  });

  it('create: ISBN duplikat -> ConflictException', async () => {
    repository.create.mockRejectedValue(
      new ConflictException('ISBN sudah digunakan oleh buku lain'),
    );
    await expect(service.create(dto)).rejects.toThrow(ConflictException);
  });

  it('findAll: mengembalikan seluruh buku', async () => {
    const list = [{ id: 1, ...dto }];
    repository.findAll.mockResolvedValue(list);
    const result = await service.findAll();
    expect(result).toEqual(list);
    expect(repository.findAll).toHaveBeenCalled();
  });

  it('findOne: buku ada -> dikembalikan', async () => {
    repository.findById.mockResolvedValue({ id: 1, ...dto });
    const result = await service.findOne(1);
    expect(result.id).toBe(1);
    expect(repository.findById).toHaveBeenCalledWith(1);
  });

  it('findOne: id tidak ada -> NotFoundException', async () => {
    repository.findById.mockResolvedValue(undefined);
    await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
  });

  it('update: mengembalikan buku yang diperbarui', async () => {
    repository.merge.mockResolvedValue({ id: 1, ...dto, title: 'Baru' });
    const result = await service.update(1, { title: 'Baru' });
    expect(result.title).toBe('Baru');
    expect(repository.merge).toHaveBeenCalledWith(1, { title: 'Baru' });
  });

  it('update: id tidak ada -> NotFoundException', async () => {
    repository.merge.mockResolvedValue(undefined);
    await expect(service.update(999, { title: 'X' })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('remove: buku ada -> berhasil', async () => {
    repository.remove.mockResolvedValue(true);
    await expect(service.remove(1)).resolves.toBeUndefined();
    expect(repository.remove).toHaveBeenCalledWith(1);
  });

  it('remove: id tidak ada -> NotFoundException', async () => {
    repository.remove.mockResolvedValue(false);
    await expect(service.remove(999)).rejects.toThrow(NotFoundException);
  });
});
