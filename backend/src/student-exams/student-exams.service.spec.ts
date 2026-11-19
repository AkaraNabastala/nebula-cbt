import { ForbiddenException } from '@nestjs/common';
import { StudentExamsService } from './student-exams.service.js';
import type { PrismaService } from '../prisma/prisma.service.js';

describe('StudentExamsService', () => {
  const prisma = {
    studentProfile: { findUnique: vi.fn() },
    examParticipant: { findMany: vi.fn() },
  } as unknown as PrismaService;

  const service = new StudentExamsService(prisma);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not expose exam assignments without a student profile', async () => {
    vi.mocked(prisma.studentProfile.findUnique).mockResolvedValue(null);

    await expect(service.listExams({ id: 'user-without-student-profile' }))
      .rejects.toBeInstanceOf(ForbiddenException);

    expect(prisma.examParticipant.findMany).not.toHaveBeenCalled();
  });

  it('lists only participant records owned by the authenticated student profile', async () => {
    vi.mocked(prisma.studentProfile.findUnique).mockResolvedValue({ id: 'student-profile-1' } as never);
    vi.mocked(prisma.examParticipant.findMany).mockResolvedValue([] as never);

    await expect(service.listExams({ id: 'student-user-1' })).resolves.toEqual([]);
    expect(prisma.examParticipant.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { studentProfileId: 'student-profile-1' } }),
    );
  });
});
