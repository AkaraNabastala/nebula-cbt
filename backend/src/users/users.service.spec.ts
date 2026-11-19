import { ConflictException } from '@nestjs/common';
import { UsersService } from './users.service.js';
import type { PrismaService } from '../prisma/prisma.service.js';

describe('UsersService', () => {
  const prisma = {
    $transaction: vi.fn(),
    user: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
  } as unknown as PrismaService;

  const service = new UsersService(prisma);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns a paginated list without selecting password hashes', async () => {
    const user = {
      id: 'user-1',
      fullName: 'Siswa Contoh',
      status: 'ACTIVE',
      mustChangePassword: true,
      lastLoginAt: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      identifiers: [{
        identifierType: 'USERNAME',
        identifierValue: 'siswa.contoh',
        isPrimary: true,
      }],
      userRoles: [{ role: { code: 'STUDENT', name: 'Siswa' } }],
    };

    vi.mocked(prisma.$transaction).mockResolvedValue([1, [user]] as never);

    const result = await service.list({
      page: 2,
      limit: 10,
      search: 'siswa',
      status: 'ACTIVE',
      role: 'STUDENT',
    });

    expect(result.pagination).toEqual({
      page: 2,
      limit: 10,
      total: 1,
      totalPages: 1,
    });
    expect(result.data[0]).toMatchObject({
      id: 'user-1',
      roles: [{ code: 'STUDENT', name: 'Siswa' }],
    });
    expect(result.data[0]).not.toHaveProperty('passwordHash');
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10,
        take: 10,
        select: expect.not.objectContaining({ passwordHash: true }),
      }),
    );
  });

  it('does not allow an administrator to deactivate their own account', async () => {
    await expect(
      service.updateStatus('admin-1', 'INACTIVE', { id: 'admin-1' }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
