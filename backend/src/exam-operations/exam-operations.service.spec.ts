import { BadRequestException } from '@nestjs/common';
import { ExamOperationsService } from './exam-operations.service.js';
import type { PrismaService } from '../prisma/prisma.service.js';

describe('ExamOperationsService', () => {
  const prisma = {
    $transaction: vi.fn(),
    academicYear: { findUnique: vi.fn() },
    subject: { findUnique: vi.fn() },
    assessmentType: { findFirst: vi.fn() },
    schoolClass: { findMany: vi.fn() },
    teacherProfile: { findUnique: vi.fn() },
    teacherAssignment: { findMany: vi.fn() },
    question: { findMany: vi.fn() },
  } as unknown as PrismaService;

  const service = new ExamOperationsService(prisma);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const baseDto = {
    name: 'Ujian Matematika',
    assessmentTypeId: '00000000-0000-4000-8000-000000000001',
    academicYearId: '00000000-0000-4000-8000-000000000002',
    subjectId: '00000000-0000-4000-8000-000000000003',
    sessionName: 'Sesi 1',
    startsAt: '2026-11-20T01:00:00.000Z',
    endsAt: '2026-11-20T03:00:00.000Z',
    durationMinutes: 90,
    classIds: ['00000000-0000-4000-8000-000000000004'],
    questionIds: ['00000000-0000-4000-8000-000000000005'],
    shuffleQuestions: false,
    shuffleOptions: false,
  };

  it('rejects a schedule whose end is before its start', async () => {
    await expect(service.create({
      ...baseDto,
      endsAt: '2026-11-20T00:30:00.000Z',
    }, { id: 'admin-1', roles: ['ADMIN'] })).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.academicYear.findUnique).not.toHaveBeenCalled();
  });

  it('rejects duplicate class or question identifiers', async () => {
    await expect(service.create({
      ...baseDto,
      classIds: [...baseDto.classIds, baseDto.classIds[0]],
    }, { id: 'admin-1', roles: ['ADMIN'] })).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.academicYear.findUnique).not.toHaveBeenCalled();
  });
});
