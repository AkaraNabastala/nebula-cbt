import { BadRequestException } from '@nestjs/common';
import { ExamOperationsService } from './exam-operations.service.js';
import type { PrismaService } from '../prisma/prisma.service.js';

describe('ExamOperationsService', () => {
  const tx = {
    exam: { findUnique: vi.fn(), update: vi.fn() },
    teacherAssignment: { findMany: vi.fn() },
    studentClass: { findMany: vi.fn() },
    examPaper: { update: vi.fn() },
    examSchedule: { update: vi.fn() },
    assessmentEvent: { update: vi.fn() },
    examParticipant: { createMany: vi.fn(), count: vi.fn() },
    auditLog: { create: vi.fn() },
  };
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

  it('publishes the exam and registers active students from its selected classes', async () => {
    vi.mocked(prisma.$transaction).mockImplementation(
      ((callback: (client: typeof tx) => Promise<unknown>) => callback(tx)) as never,
    );
    vi.mocked(tx.exam.findUnique).mockResolvedValue({
      id: 'exam-1',
      name: 'Ujian Matematika',
      status: 'DRAFT',
      subjectId: 'subject-1',
      assessmentEventId: 'event-1',
      assessmentEvent: { id: 'event-1' },
      schedules: [{
        id: 'schedule-1',
        defaultExamPaper: { id: 'paper-1', _count: { questions: 2 } },
        scheduleClasses: [{ schoolClassId: 'class-1' }],
      }],
    } as never);
    vi.mocked(tx.studentClass.findMany).mockResolvedValue([
      { studentProfileId: 'student-profile-1', classId: 'class-1' },
      { studentProfileId: 'student-profile-2', classId: 'class-1' },
    ] as never);
    vi.mocked(tx.examParticipant.count).mockResolvedValue(2 as never);

    const result = await service.publish('exam-1', { id: 'admin-1', roles: ['ADMIN'] });

    expect(result).toMatchObject({
      id: 'exam-1',
      status: 'PUBLISHED',
      participantCount: 2,
      alreadyPublished: false,
    });
    expect(tx.examParticipant.createMany).toHaveBeenCalledWith(expect.objectContaining({
      data: [
        expect.objectContaining({
          examScheduleId: 'schedule-1',
          studentProfileId: 'student-profile-1',
          examPaperId: 'paper-1',
          schoolClassId: 'class-1',
        }),
        expect.objectContaining({
          examScheduleId: 'schedule-1',
          studentProfileId: 'student-profile-2',
          examPaperId: 'paper-1',
          schoolClassId: 'class-1',
        }),
      ],
      skipDuplicates: true,
    }));
    expect(tx.exam.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'exam-1' },
      data: { status: 'PUBLISHED' },
    }));
  });

});
