import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { QuestionBanksService } from './question-banks.service.js';
import type { PrismaService } from '../prisma/prisma.service.js';

describe('QuestionBanksService', () => {
  const prisma = {
    $transaction: vi.fn(),
    subject: { findUnique: vi.fn() },
    teacherProfile: { findUnique: vi.fn() },
    teacherAssignment: { findFirst: vi.fn() },
    questionBank: { findUnique: vi.fn() },
    question: { findMany: vi.fn() },
  } as unknown as PrismaService;

  const service = new QuestionBanksService(prisma);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('requires exactly one correct option for a single-choice question', async () => {
    vi.mocked(prisma.questionBank.findUnique).mockResolvedValue({
      id: 'bank-1',
      subjectId: 'subject-1',
      name: 'Matematika',
    } as never);

    await expect(service.createQuestion('bank-1', {
      type: 'SINGLE_CHOICE',
      difficulty: 'MEDIUM',
      content: 'Berapa hasil 2 + 2?',
      points: 1,
      options: [
        { label: 'A', text: '4' },
        { label: 'B', text: '5' },
      ],
      correctLabels: ['A', 'B'],
    }, { id: 'admin-1', roles: ['ADMIN'] })).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejects teacher access to a bank outside their active assignments', async () => {
    vi.mocked(prisma.questionBank.findUnique).mockResolvedValue({
      id: 'bank-1',
      subjectId: 'subject-1',
      name: 'Matematika',
    } as never);
    vi.mocked(prisma.teacherProfile.findUnique).mockResolvedValue({ id: 'teacher-1' } as never);
    vi.mocked(prisma.teacherAssignment.findFirst).mockResolvedValue(null);

    await expect(service.listQuestions('bank-1', {
      id: 'teacher-user-1',
      roles: ['TEACHER'],
    })).rejects.toBeInstanceOf(ForbiddenException);

    expect(prisma.question.findMany).not.toHaveBeenCalled();
  });
});
