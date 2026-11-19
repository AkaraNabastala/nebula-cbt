import { ForbiddenException } from '@nestjs/common';
import { StudentExamsService } from './student-exams.service.js';
import type { PrismaService } from '../prisma/prisma.service.js';

describe('StudentExamsService', () => {
  const tx = {
    examParticipant: { findFirst: vi.fn(), update: vi.fn() },
    attempt: { create: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
    attemptDeviceSession: { findFirst: vi.fn(), updateMany: vi.fn(), create: vi.fn() },
    attemptSyncLog: { findUnique: vi.fn(), create: vi.fn() },
    attemptAnswer: { findUnique: vi.fn(), upsert: vi.fn() },
  };
  const prisma = {
    $transaction: vi.fn(),
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

  it('starts an assigned exam and returns the question snapshot without its answer key', async () => {
    const now = Date.now();
    const deadlineAt = new Date(now + 30 * 60_000);
    vi.mocked(prisma.studentProfile.findUnique).mockResolvedValue({ id: 'student-profile-1' } as never);
    vi.mocked(prisma.$transaction).mockImplementation(
      ((callback: (client: typeof tx) => Promise<unknown>) => callback(tx)) as never,
    );
    vi.mocked(tx.examParticipant.findFirst).mockResolvedValue({
      id: 'participant-1',
      status: 'REGISTERED',
      examSchedule: {
        status: 'PUBLISHED',
        startsAt: new Date(now - 60_000),
        endsAt: new Date(now + 60 * 60_000),
        durationMinutes: 30,
        exam: { status: 'PUBLISHED' },
      },
      examPaper: {
        shuffleQuestions: false,
        shuffleOptions: false,
        questions: [{
          id: 'paper-question-1',
          sortOrder: 0,
          points: '2',
          questionSnapshot: {
            type: 'SINGLE_CHOICE',
            difficulty: 'MEDIUM',
            content: { text: 'Berapa hasil 2 + 2?' },
            options: [{ id: 'option-a', label: 'A', content: { text: '4' } }],
          },
        }],
      },
      attempt: null,
    } as never);
    vi.mocked(tx.attempt.create).mockResolvedValue({
      id: 'attempt-1',
      status: 'IN_PROGRESS',
      startedAt: new Date(now),
      deadlineAt,
      serverVersion: 0,
      answers: [],
    } as never);
    vi.mocked(tx.attemptDeviceSession.create).mockResolvedValue({ id: 'device-session-1' } as never);

    const result = await service.start('participant-1', {
      deviceFingerprint: 'browser-fingerprint',
    }, { id: 'student-user-1' });

    expect(result).toMatchObject({
      attemptId: 'attempt-1',
      status: 'IN_PROGRESS',
      questions: [{
        id: 'paper-question-1',
        type: 'SINGLE_CHOICE',
        content: { text: 'Berapa hasil 2 + 2?' },
        options: [{ id: 'option-a', label: 'A', content: { text: '4' } }],
        points: 2,
      }],
    });
    expect(result).toHaveProperty('sessionToken');
    expect(JSON.stringify(result)).not.toContain('answerKey');
    expect(tx.examParticipant.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'participant-1' },
      data: { status: 'IN_PROGRESS' },
    }));
  });

  it('accepts and stores a valid answer batch for the active attempt', async () => {
    vi.mocked(prisma.studentProfile.findUnique).mockResolvedValue({ id: 'student-profile-1' } as never);
    vi.mocked(prisma.$transaction).mockImplementation(
      ((callback: (client: typeof tx) => Promise<unknown>) => callback(tx)) as never,
    );
    vi.mocked(tx.attemptDeviceSession.findFirst).mockResolvedValue({
      id: 'device-session-1',
      attempt: { participant: { studentProfileId: 'student-profile-1' } },
    } as never);
    vi.mocked(tx.attempt.findFirst).mockResolvedValue({
      id: 'attempt-1',
      status: 'IN_PROGRESS',
      deadlineAt: new Date(Date.now() + 10 * 60_000),
      serverVersion: 0,
      participant: {
        examPaper: {
          questions: [{
            id: 'paper-question-1',
            questionSnapshot: {
              type: 'SINGLE_CHOICE',
              options: [{ id: 'option-a', label: 'A', content: { text: '4' } }],
            },
          }],
        },
      },
    } as never);
    vi.mocked(tx.attemptSyncLog.findUnique).mockResolvedValue(null);
    vi.mocked(tx.attemptAnswer.findUnique).mockResolvedValue(null);
    vi.mocked(tx.attempt.update).mockResolvedValue({ serverVersion: 1 } as never);

    const result = await service.sync('attempt-1', 'session-token', {
      clientBatchId: 'batch-1',
      answers: [{
        questionId: 'paper-question-1',
        answerData: { selectedOptionId: 'option-a' },
        answerVersion: 1,
      }],
    }, { id: 'student-user-1' });

    expect(result).toMatchObject({
      status: 'RECEIVED',
      acceptedCount: 1,
      rejectedCount: 0,
      acceptedQuestionIds: ['paper-question-1'],
      duplicate: false,
    });
    expect(tx.attemptAnswer.upsert).toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({
        attemptId: 'attempt-1',
        examPaperQuestionId: 'paper-question-1',
        answerData: { selectedOptionId: 'option-a' },
        answerVersion: 1,
      }),
    }));
    expect(tx.attemptSyncLog.create).toHaveBeenCalled();
  });

});
