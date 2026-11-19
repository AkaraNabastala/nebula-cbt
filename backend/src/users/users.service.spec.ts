import { ConflictException } from '@nestjs/common';
import { UsersService } from './users.service.js';
import type { PrismaService } from '../prisma/prisma.service.js';

describe('UsersService', () => {
  const tx = {
    role: { findUnique: vi.fn() },
    userIdentifier: { findUnique: vi.fn() },
    user: { create: vi.fn() },
    auditLog: { create: vi.fn() },
  };
  const prisma = {
    $transaction: vi.fn(),
    role: { findUnique: vi.fn() },
    userIdentifier: { findUnique: vi.fn() },
    user: {
      count: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
    },
    auditLog: { create: vi.fn() },
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

  it('creates a student account with a profile and forced password change', async () => {
    vi.mocked(prisma.$transaction).mockImplementation(
      ((callback: (client: typeof tx) => Promise<unknown>) => callback(tx)) as never,
    );
    vi.mocked(tx.role.findUnique).mockResolvedValue({
      id: 'role-student',
      code: 'STUDENT',
      name: 'Siswa',
    } as never);
    vi.mocked(tx.userIdentifier.findUnique).mockResolvedValue(null);
    vi.mocked(tx.user.create).mockResolvedValue({
      id: 'student-user-1',
      fullName: 'Siswa Contoh',
      status: 'ACTIVE',
      mustChangePassword: true,
      createdAt: new Date('2026-11-19T00:00:00.000Z'),
      identifiers: [{ identifierType: 'USERNAME', identifierValue: 'siswa.001', isPrimary: true }],
      userRoles: [{ role: { code: 'STUDENT', name: 'Siswa' } }],
    } as never);

    const result = await service.create({
      fullName: 'Siswa Contoh',
      identifierType: 'USERNAME',
      identifier: 'siswa.001',
      password: 'password-awal',
      roleCode: 'STUDENT',
    }, { id: 'admin-1' });

    expect(result.roles).toEqual([{ code: 'STUDENT', name: 'Siswa' }]);
    expect(tx.user.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        mustChangePassword: true,
        studentProfile: { create: {} },
        userRoles: { create: { role: { connect: { id: 'role-student' } } } },
      }),
    }));
    const createCall = vi.mocked(tx.user.create).mock.calls[0][0] as { data: { passwordHash: string } };
    expect(createCall.data.passwordHash).not.toBe('password-awal');
    expect(tx.auditLog.create).toHaveBeenCalled();
  });

  it('creates a teacher profile when the selected role is TEACHER', async () => {
    vi.mocked(prisma.$transaction).mockImplementation(
      ((callback: (client: typeof tx) => Promise<unknown>) => callback(tx)) as never,
    );
    vi.mocked(tx.role.findUnique).mockResolvedValue({
      id: 'role-teacher',
      code: 'TEACHER',
      name: 'Guru',
    } as never);
    vi.mocked(tx.userIdentifier.findUnique).mockResolvedValue(null);
    vi.mocked(tx.user.create).mockResolvedValue({
      id: 'teacher-user-1',
      fullName: 'Guru Contoh',
      status: 'ACTIVE',
      mustChangePassword: true,
      createdAt: new Date('2026-11-19T00:00:00.000Z'),
      identifiers: [{ identifierType: 'EMAIL', identifierValue: 'guru@example.test', isPrimary: true }],
      userRoles: [{ role: { code: 'TEACHER', name: 'Guru' } }],
    } as never);

    await service.create({
      fullName: 'Guru Contoh',
      identifierType: 'EMAIL',
      identifier: 'guru@example.test',
      password: 'password-awal',
      roleCode: 'TEACHER',
    }, { id: 'admin-1' });

    expect(tx.user.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ teacherProfile: { create: {} } }),
    }));
  });

});
