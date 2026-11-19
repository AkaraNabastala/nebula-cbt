import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { StartAttemptDto } from './dto/start-attempt.dto.js';
import type { SyncAttemptDto } from './dto/sync-attempt.dto.js';

type Actor = { id: string; ipAddress?: string; userAgent?: string };
type SnapshotOption = { id: string; label: string; content: { text?: string } };
type QuestionSnapshot = {
  type: string;
  difficulty: string;
  content: { text?: string };
  options?: SnapshotOption[];
};

function hash(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

function stableShuffle<T extends { id: string }>(items: T[], seed: string): T[] {
  return [...items].sort((left, right) =>
    hash(`${seed}:${left.id}`).localeCompare(hash(`${seed}:${right.id}`)),
  );
}

@Injectable()
export class StudentExamsService {
  constructor(private readonly prisma: PrismaService) {}

  private async studentProfileId(actor: Actor) {
    const profile = await this.prisma.studentProfile.findUnique({
      where: { userId: actor.id },
      select: { id: true },
    });
    if (!profile) throw new ForbiddenException('Profil siswa tidak ditemukan.');
    return profile.id;
  }

  async listExams(actor: Actor) {
    const studentProfileId = await this.studentProfileId(actor);
    const rows = await this.prisma.examParticipant.findMany({
      where: { studentProfileId },
      orderBy: { examSchedule: { startsAt: 'asc' } },
      include: {
        examSchedule: {
          include: {
            exam: { select: { id: true, name: true, status: true, subject: { select: { name: true } }, assessmentEvent: { select: { name: true } } } },
          },
        },
        attempt: { select: { id: true, status: true, startedAt: true, deadlineAt: true, submittedAt: true } },
      },
    });
    return rows.map((row) => ({
      id: row.id,
      status: row.status,
      exam: row.examSchedule.exam,
      schedule: {
        id: row.examSchedule.id,
        sessionName: row.examSchedule.sessionName,
        startsAt: row.examSchedule.startsAt,
        endsAt: row.examSchedule.endsAt,
        durationMinutes: row.examSchedule.durationMinutes,
        status: row.examSchedule.status,
      },
      attempt: row.attempt,
    }));
  }

  private async createDeviceSession(tx: Prisma.TransactionClient, attemptId: string, dto: StartAttemptDto, actor: Actor) {
    const sessionToken = randomBytes(32).toString('base64url');
    await tx.attemptDeviceSession.updateMany({
      where: { attemptId, status: 'ACTIVE' },
      data: { status: 'REVOKED', revokedAt: new Date() },
    });
    await tx.attemptDeviceSession.create({
      data: {
        attemptId,
        deviceFingerprintHash: hash(dto.deviceFingerprint),
        sessionTokenHash: hash(sessionToken),
        ipAddress: actor.ipAddress,
        userAgent: actor.userAgent,
      },
    });
    return sessionToken;
  }

  private clientQuestions(
    paper: { shuffleQuestions: boolean; shuffleOptions: boolean; questions: { id: string; questionSnapshot: Prisma.JsonValue; points: Prisma.Decimal; sortOrder: number }[] },
    attemptId: string,
  ) {
    const ordered = paper.shuffleQuestions
      ? stableShuffle(paper.questions.map((question) => ({ ...question })), attemptId)
      : [...paper.questions].sort((left, right) => left.sortOrder - right.sortOrder);
    return ordered.map((item, index) => {
      const snapshot = item.questionSnapshot as unknown as QuestionSnapshot;
      const options = snapshot.options ?? [];
      const visibleOptions = paper.shuffleOptions ? stableShuffle(options, `${attemptId}:${item.id}`) : options;
      return {
        id: item.id,
        type: snapshot.type,
        difficulty: snapshot.difficulty,
        content: snapshot.content,
        options: visibleOptions,
        points: Number(item.points),
        sortOrder: index,
      };
    });
  }

  async start(participantId: string, dto: StartAttemptDto, actor: Actor) {
    const studentProfileId = await this.studentProfileId(actor);
    return this.prisma.$transaction(async (tx) => {
      const participant = await tx.examParticipant.findFirst({
        where: { id: participantId, studentProfileId },
        include: {
          examSchedule: { include: { exam: true } },
          examPaper: { include: { questions: { orderBy: { sortOrder: 'asc' } } } },
          attempt: { include: { answers: true, receipt: true } },
        },
      });
      if (!participant) throw new NotFoundException('Jadwal ujian untuk akun ini tidak ditemukan.');
      if (participant.examSchedule.status !== 'PUBLISHED' || participant.examSchedule.exam.status !== 'PUBLISHED') {
        throw new ConflictException('Ujian belum diterbitkan.');
      }

      const now = new Date();
      const schedule = participant.examSchedule;
      if (now < schedule.startsAt) throw new ConflictException('Ujian belum dimulai.');
      if (now >= schedule.endsAt) throw new ConflictException('Waktu sesi ujian sudah berakhir.');

      let attempt = participant.attempt;
      if (attempt && attempt.status !== 'IN_PROGRESS') {
        return {
          alreadyClosed: true,
          status: attempt.status,
          receipt: participant.attempt?.receipt ?? null,
          serverTime: now,
        };
      }
      if (!attempt) {
        if (participant.status !== 'REGISTERED' && participant.status !== 'CHECKED_IN') {
          throw new ConflictException('Status peserta tidak mengizinkan memulai ujian.');
        }
        const deadlineAt = new Date(Math.min(now.getTime() + schedule.durationMinutes * 60000, schedule.endsAt.getTime()));
        attempt = await tx.attempt.create({
          data: { participantId: participant.id, startedAt: now, deadlineAt },
          include: { answers: true, receipt: true },
        });
        await tx.examParticipant.update({ where: { id: participant.id }, data: { status: 'IN_PROGRESS' } });
      }
      if (now >= attempt.deadlineAt) {
        const closed = await this.finalize(tx, attempt.id, true);
        return { alreadyClosed: true, ...closed, serverTime: now };
      }

      const sessionToken = await this.createDeviceSession(tx, attempt.id, dto, actor);
      const paper = participant.examPaper;
      return {
        attemptId: attempt.id,
        sessionToken,
        status: attempt.status,
        startedAt: attempt.startedAt,
        deadlineAt: attempt.deadlineAt,
        serverTime: now,
        serverVersion: attempt.serverVersion,
        questions: this.clientQuestions(paper, attempt.id),
        answers: attempt.answers.map((answer) => ({
          questionId: answer.examPaperQuestionId,
          answerData: answer.answerData,
          answerVersion: answer.answerVersion,
          updatedAt: answer.updatedAt,
        })),
      };
    });
  }

  private async assertSession(
    tx: Prisma.TransactionClient,
    attemptId: string,
    sessionToken: string | undefined,
    studentProfileId: string,
  ) {
    if (!sessionToken) throw new ForbiddenException('Sesi ujian tidak ditemukan. Mulai ulang atau pulihkan sesi.');
    const session = await tx.attemptDeviceSession.findFirst({
      where: { attemptId, sessionTokenHash: hash(sessionToken), status: 'ACTIVE' },
      select: { id: true, attempt: { select: { participant: { select: { studentProfileId: true } } } },
    });
    if (!session || session.attempt.participant.studentProfileId !== studentProfileId) {
      throw new ForbiddenException('Token sesi ujian tidak valid.');
    }
    return session;
  }

  async resume(attemptId: string, sessionToken: string | undefined, actor: Actor) {
    const studentProfileId = await this.studentProfileId(actor);
    await this.prisma.$transaction(async (tx) => {
      await this.assertSession(tx, attemptId, sessionToken, studentProfileId);
    });
    const attempt = await this.prisma.attempt.findFirst({
      where: { id: attemptId, participant: { studentProfileId } },
      include: {
        participant: { include: { examPaper: { include: { questions: { orderBy: { sortOrder: 'asc' } } } } } },
        answers: true,
        receipt: true,
      },
    });
    if (!attempt) throw new NotFoundException('Percobaan ujian tidak ditemukan.');
    return {
      attemptId: attempt.id,
      status: attempt.status,
      startedAt: attempt.startedAt,
      deadlineAt: attempt.deadlineAt,
      serverTime: new Date(),
      serverVersion: attempt.serverVersion,
      questions: this.clientQuestions(attempt.participant.examPaper, attempt.id),
      answers: attempt.answers.map((answer) => ({
        questionId: answer.examPaperQuestionId,
        answerData: answer.answerData,
        answerVersion: answer.answerVersion,
        updatedAt: answer.updatedAt,
      })),
      receipt: attempt.receipt,
    };
  }

  private isValidAnswer(snapshot: QuestionSnapshot, answerData: Record<string, unknown>) {
    const options = snapshot.options ?? [];
    if (snapshot.type === 'SINGLE_CHOICE' || snapshot.type === 'TRUE_FALSE') {
      return typeof answerData.selectedOptionId === 'string' && options.some((option) => option.id === answerData.selectedOptionId);
    }
    if (snapshot.type === 'MULTIPLE_CHOICE') {
      return Array.isArray(answerData.selectedOptionIds) &&
        answerData.selectedOptionIds.every((id) => typeof id === 'string' && options.some((option) => option.id === id));
    }
    return (snapshot.type === 'SHORT_ANSWER' || snapshot.type === 'ESSAY') && typeof answerData.text === 'string';
  }

  async sync(attemptId: string, sessionToken: string | undefined, dto: SyncAttemptDto, actor: Actor) {
    const studentProfileId = await this.studentProfileId(actor);
    return this.prisma.$transaction(async (tx) => {
      await this.assertSession(tx, attemptId, sessionToken, studentProfileId);
      const attempt = await tx.attempt.findFirst({
        where: { id: attemptId, participant: { studentProfileId } },
        include: { participant: { include: { examPaper: { include: { questions: true } } } } },
      });
      if (!attempt) throw new NotFoundException('Percobaan ujian tidak ditemukan.');
      const previousBatch = await tx.attemptSyncLog.findUnique({
        where: { attemptId_clientBatchId: { attemptId, clientBatchId: dto.clientBatchId } },
      });
      if (previousBatch) return {
        clientBatchId: dto.clientBatchId,
        status: previousBatch.status,
        acceptedCount: previousBatch.acceptedCount,
        rejectedCount: previousBatch.rejectedCount,
        serverVersion: attempt.serverVersion,
        serverTime: new Date(),
        duplicate: true,
      };
      if (attempt.status !== 'IN_PROGRESS') throw new ConflictException('Percobaan ujian sudah ditutup.');
      const now = new Date();
      if (now >= attempt.deadlineAt) throw new ConflictException('Waktu ujian telah habis. Kirim perintah selesai untuk menutup percobaan.');

      const questions = new Map(attempt.participant.examPaper.questions.map((question) => [question.id, question]));
      let acceptedCount = 0;
      let rejectedCount = 0;
      const acceptedIds: string[] = [];
      for (const item of dto.answers) {
        const question = questions.get(item.questionId);
        if (!question || !this.isValidAnswer(question.questionSnapshot as unknown as QuestionSnapshot, item.answerData)) {
          rejectedCount += 1;
          continue;
        }
        const answerVersion = item.answerVersion ?? 1;
        const current = await tx.attemptAnswer.findUnique({
          where: { attemptId_examPaperQuestionId: { attemptId, examPaperQuestionId: item.questionId } },
          select: { answerVersion: true },
        });
        if (current && current.answerVersion >= answerVersion) {
          rejectedCount += 1;
          continue;
        }
        await tx.attemptAnswer.upsert({
          where: { attemptId_examPaperQuestionId: { attemptId, examPaperQuestionId: item.questionId } },
          create: {
            attemptId,
            examPaperQuestionId: item.questionId,
            answerData: item.answerData as Prisma.InputJsonValue,
            answerVersion,
          },
          update: { answerData: item.answerData as Prisma.InputJsonValue, answerVersion },
        });
        acceptedCount += 1;
        acceptedIds.push(item.questionId);
      }
      const status = acceptedCount === 0 ? 'REJECTED' : rejectedCount > 0 ? 'PARTIALLY_ACCEPTED' : 'RECEIVED';
      const updated = await tx.attempt.update({
        where: { id: attemptId },
        data: { serverVersion: { increment: acceptedCount > 0 ? 1 : 0 }, lastSyncedAt: now },
        select: { serverVersion: true },
      });
      await tx.attemptSyncLog.create({
        data: {
          attemptId,
          clientBatchId: dto.clientBatchId,
          status,
          receivedCount: dto.answers.length,
          acceptedCount,
          rejectedCount,
          details: { acceptedQuestionIds: acceptedIds } as Prisma.InputJsonValue,
        },
      });
      await tx.attemptDeviceSession.updateMany({
        where: { attemptId, sessionTokenHash: hash(sessionToken!), status: 'ACTIVE' },
        data: { lastSeenAt: now },
      });
      return { clientBatchId: dto.clientBatchId, status, acceptedCount, rejectedCount, serverVersion: updated.serverVersion, serverTime: now, duplicate: false };
    });
  }

  private async finalize(tx: Prisma.TransactionClient, attemptId: string, expired: boolean) {
    const attempt = await tx.attempt.findUnique({
      where: { id: attemptId },
      include: {
        answers: true,
        participant: {
          include: {
            examPaper: { include: { questions: true } },
            examSchedule: { include: { exam: { include: { assessmentEvent: true } } } },
          },
        },
        receipt: true,
      },
    });
    if (!attempt) throw new NotFoundException('Percobaan ujian tidak ditemukan.');
    if (attempt.receipt) return { status: attempt.status, receipt: attempt.receipt, alreadySubmitted: true };
    const answerMap = new Map(attempt.answers.map((answer) => [answer.examPaperQuestionId, answer.answerData as Record<string, unknown>]));
    let rawScore = 0;
    let hasEssay = false;
    for (const question of attempt.participant.examPaper.questions) {
      const snapshot = question.questionSnapshot as unknown as QuestionSnapshot;
      const key = question.answerKeySnapshot as unknown as { answerData?: { correctLabels?: string[]; acceptedAnswers?: string[] } };
      const answer = answerMap.get(question.id);
      let correct = false;
      if (snapshot.type === 'ESSAY') {
        hasEssay = true;
      } else if (answer && (snapshot.type === 'SINGLE_CHOICE' || snapshot.type === 'TRUE_FALSE')) {
        const selected = snapshot.options?.find((option) => option.id === answer.selectedOptionId)?.label;
        correct = Boolean(selected && key.answerData?.correctLabels?.includes(selected));
      } else if (answer && snapshot.type === 'MULTIPLE_CHOICE') {
        const selected = (Array.isArray(answer.selectedOptionIds) ? answer.selectedOptionIds : [])
          .map((id) => snapshot.options?.find((option) => option.id === id)?.label)
          .filter((label): label is string => Boolean(label))
          .sort();
        const expected = [...(key.answerData?.correctLabels ?? [])].sort();
        correct = selected.length === expected.length && selected.every((label, index) => label === expected[index]);
      } else if (answer && snapshot.type === 'SHORT_ANSWER') {
        const submitted = typeof answer.text === 'string' ? answer.text.trim().toLocaleLowerCase() : '';
        correct = Boolean(submitted && key.answerData?.acceptedAnswers?.some((value) => value.trim().toLocaleLowerCase() === submitted));
      }
      if (correct) rawScore += Number(question.points);
    }

    const now = new Date();
    const receiptCode = `NBL-${randomBytes(6).toString('hex').toUpperCase()}`;
    const receipt = await tx.attemptSubmissionReceipt.create({
      data: { attemptId, receiptCode, answerCount: attempt.answers.length, submittedAt: now },
    });
    await tx.attempt.update({
      where: { id: attemptId },
      data: { status: expired ? 'EXPIRED' : 'SUBMITTED', submittedAt: now },
    });
    await tx.examParticipant.update({
      where: { id: attempt.participantId },
      data: { status: 'SUBMITTED' },
    });
    await tx.attemptDeviceSession.updateMany({
      where: { attemptId, status: 'ACTIVE' },
      data: { status: 'REVOKED', revokedAt: now },
    });
    const exam = attempt.participant.examSchedule.exam;
    await tx.examResult.create({
      data: {
        attemptId,
        academicYearId: exam.assessmentEvent.academicYearId,
        schoolClassId: attempt.participant.schoolClassId,
        subjectId: exam.subjectId,
        rawScore,
        finalScore: rawScore,
        maxScore: Number(attempt.participant.examPaper.maxScore),
        status: hasEssay ? 'DRAFT' : 'GRADED',
        gradedAt: hasEssay ? null : now,
      },
    });
    return { status: expired ? 'EXPIRED' : 'SUBMITTED', receipt, alreadySubmitted: false };
  }

  async submit(attemptId: string, sessionToken: string | undefined, actor: Actor) {
    const studentProfileId = await this.studentProfileId(actor);
    return this.prisma.$transaction(async (tx) => {
      await this.assertSession(tx, attemptId, sessionToken, studentProfileId);
      const attempt = await tx.attempt.findFirst({
        where: { id: attemptId, participant: { studentProfileId } },
        select: { id: true, status: true, deadlineAt: true, receipt: true },
      });
      if (!attempt) throw new NotFoundException('Percobaan ujian tidak ditemukan.');
      if (attempt.receipt) return { status: attempt.status, receipt: attempt.receipt, alreadySubmitted: true };
      if (attempt.status !== 'IN_PROGRESS') throw new ConflictException('Percobaan ujian sudah ditutup.');
      return this.finalize(tx, attemptId, new Date() >= attempt.deadlineAt);
    });
  }
}
