import { PeopleManagementService } from './people-management.service.js';
import type { PrismaService } from '../prisma/prisma.service.js';

describe('PeopleManagementService', () => {
  const tx = {
    teacherAssignment: { findUnique: vi.fn(), update: vi.fn() },
    auditLog: { create: vi.fn() },
  };
  const prisma = {
    $transaction: vi.fn(),
  } as unknown as PrismaService;
  const service = new PeopleManagementService(prisma);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.$transaction).mockImplementation(
      ((callback: (client: typeof tx) => Promise<unknown>) => callback(tx)) as never,
    );
  });

  it('updates assignment status and its audit log in one transaction', async () => {
    vi.mocked(tx.teacherAssignment.findUnique).mockResolvedValue({ id: 'assignment-1', isActive: true } as never);
    vi.mocked(tx.teacherAssignment.update).mockResolvedValue({ id: 'assignment-1', isActive: false } as never);

    await expect(service.updateTeacherAssignmentStatus(
      'assignment-1',
      false,
      { id: 'admin-1', roles: ['ADMIN'] },
    )).resolves.toMatchObject({ isActive: false });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.teacherAssignment.update).toHaveBeenCalledWith({
      where: { id: 'assignment-1' },
      data: { isActive: false },
    });
    expect(tx.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        action: 'TEACHER_ASSIGNMENT_STATUS_CHANGED',
        oldData: { isActive: true },
        newData: { isActive: false },
      }),
    }));
  });

  it('does not write a duplicate audit entry when status is unchanged', async () => {
    vi.mocked(tx.teacherAssignment.findUnique).mockResolvedValue({ id: 'assignment-1', isActive: true } as never);

    await expect(service.updateTeacherAssignmentStatus(
      'assignment-1',
      true,
      { id: 'admin-1', roles: ['ADMIN'] },
    )).resolves.toMatchObject({ isActive: true });

    expect(tx.teacherAssignment.update).not.toHaveBeenCalled();
    expect(tx.auditLog.create).not.toHaveBeenCalled();
  });
});
