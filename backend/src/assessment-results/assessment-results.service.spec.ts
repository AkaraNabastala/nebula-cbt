import { ForbiddenException } from '@nestjs/common';
import { AssessmentResultsService } from './assessment-results.service.js';
import type { PrismaService } from '../prisma/prisma.service.js';

describe('AssessmentResultsService', () => {
  const prisma = {
    studentProfile: { findUnique: vi.fn() },
    teacherProfile: { findUnique: vi.fn() },
    teacherAssignment: { findMany: vi.fn() },
    examResult: { findMany: vi.fn() },
  } as unknown as PrismaService;

  const service = new AssessmentResultsService(prisma);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not return student results without an authenticated student profile', async () => {
    vi.mocked(prisma.studentProfile.findUnique).mockResolvedValue(null);

    await expect(service.studentResults({ id: 'user-without-student-profile', roles: ['STUDENT'] }))
      .rejects.toBeInstanceOf(ForbiddenException);

    expect(prisma.examResult.findMany).not.toHaveBeenCalled();
  });
});
