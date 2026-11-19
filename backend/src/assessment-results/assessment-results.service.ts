import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { GradeEssayDto } from './dto/grade-essay.dto.js';

type Actor = { id: string; roles: string[]; ipAddress?: string; userAgent?: string };

@Injectable()
export class AssessmentResultsService {
  constructor(private readonly prisma: PrismaService) {}

  private isAdmin(actor: Actor) {
    return actor.roles.includes('ADMIN');
  }

  private async teacherProfileId(actor: Actor) {
    const profile = await this.prisma.teacherProfile.findUnique({
      where: { userId: actor.id },
      select: { id: true },
    });
    if (!profile) throw new ForbiddenException('Profil guru tidak ditemukan.');
    return profile.id;
  }

  private async assertResultAccess(result: { subjectId: string; schoolClassId: string }, actor: Actor) {
    if (this.isAdmin(actor)) return;
    const teacherProfileId = await this.teacherProfileId(actor);
    const assignment = await this.prisma.teacherAssignment.findFirst({
      where: {
        teacherProfileId,
        subjectId: result.subjectId,
        classId: result.schoolClassId,
        isActive: true,
        class: { academicYear: { isActive: true } },
      },
      select: { id: true },
    });
    if (!assignment) throw new ForbiddenException('Anda tidak memiliki akses ke hasil ujian ini.');
  }

  async list(actor: Actor) {
    const where: Prisma.ExamResultWhereInput = {};
    if (!this.isAdmin(actor)) {
      const teacherProfileId = await this.teacherProfileId(actor);
      const assignments = await this.prisma.teacherAssignment.findMany({
        where: { teacherProfileId, isActive: true },
        select: { subjectId: true, classId: true },
      });
      where.OR = assignments.map((item) => ({ subjectId: item.subjectId, schoolClassId: item.classId }));
      if (!assignments.length) return [];
    }
    return this.prisma.examResult.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        subject: { select: { id: true, name: true } },
        schoolClass: { select: { id: true, name: true } },
        academicYear: { select: { name: true } },
        attempt: {
          include: {
            participant: {
              include: {
                studentProfile: { include: { user: { select: { fullName: true } } } },
                examSchedule: { include: { exam: { select: { name: true } } } },
              },
            },
            _count: { select: { answers: true } },
          },
        },
        _count: { select: { manualGrades: true } },
      },
    });
  }

  async detail(resultId: string, actor: Actor) {
    const result = await this.prisma.examResult.findUnique({
      where: { id: resultId },
      include: {
        subject: { select: { name: true } },
        schoolClass: { select: { name: true } },
        academicYear: { select: { name: true } },
        attempt: {
          include: {
            participant: {
              include: {
                studentProfile: { include: { user: { select: { fullName: true } } } },
                examSchedule: { include: { exam: { select: { name: true } } } },
                examPaper: { include: { questions: { orderBy: { sortOrder: 'asc' } } } },
              },
            },
            answers: { include: { examPaperQuestion: true, manualGrade: true } },
          },
        },
      },
    });
    if (!result) throw new NotFoundException('Hasil ujian tidak ditemukan.');
    await this.assertResultAccess(result, actor);
    const essayAnswers = result.attempt.answers.flatMap((answer) => {
      const snapshot = answer.examPaperQuestion.questionSnapshot as { type?: string; content?: { text?: string } };
      if (snapshot.type !== 'ESSAY') return [];
      const key = answer.examPaperQuestion.answerKeySnapshot as { gradingGuide?: string | null };
      return [{
        answerId: answer.id,
        questionId: answer.examPaperQuestion.id,
        prompt: snapshot.content?.text ?? '',
        answerText: typeof (answer.answerData as { text?: unknown }).text === 'string' ? (answer.answerData as { text: string }).text : '',
        points: Number(answer.examPaperQuestion.points),
        gradingGuide: key.gradingGuide ?? '',
        manualGrade: answer.manualGrade ? {
          score: Number(answer.manualGrade.score),
          feedback: answer.manualGrade.feedback,
          gradedAt: answer.manualGrade.updatedAt,
        } : null,
      }];
    });
    return {
      id: result.id,
      status: result.status,
      studentName: result.attempt.participant.studentProfile.user.fullName,
      examName: result.attempt.participant.examSchedule.exam.name,
      className: result.schoolClass.name,
      subjectName: result.subject.name,
      academicYearName: result.academicYear.name,
      rawScore: Number(result.rawScore),
      finalScore: Number(result.finalScore),
      maxScore: Number(result.maxScore),
      essayAnswers,
    };
  }

  async gradeEssay(resultId: string, answerId: string, dto: GradeEssayDto, actor: Actor) {
    return this.prisma.$transaction(async (tx) => {
      const result = await tx.examResult.findUnique({
        where: { id: resultId },
        include: {
          attempt: {
            include: {
              participant: { include: { examPaper: { include: { questions: true } } } },
              answers: { include: { examPaperQuestion: true, manualGrade: true } },
            },
          },
          manualGrades: true,
        },
      });
      if (!result) throw new NotFoundException('Hasil ujian tidak ditemukan.');
      await this.assertResultAccess(result, actor);
      if (result.status === 'PUBLISHED') throw new ConflictException('Hasil yang sudah diterbitkan tidak dapat diubah.');
      const answer = result.attempt.answers.find((item) => item.id === answerId);
      if (!answer) throw new NotFoundException('Jawaban esai tidak ditemukan.');
      const snapshot = answer.examPaperQuestion.questionSnapshot as { type?: string };
      if (snapshot.type !== 'ESSAY') throw new BadRequestException('Penilaian manual hanya tersedia untuk soal esai.');
      const maxPoints = Number(answer.examPaperQuestion.points);
      if (dto.score > maxPoints) throw new BadRequestException(`Nilai tidak boleh melebihi ${maxPoints} poin.`);

      const existing = answer.manualGrade;
      const previousManualTotal = result.manualGrades.reduce((sum, item) => sum + Number(item.score), 0);
      const objectiveScore = Number(result.rawScore) - previousManualTotal;
      await tx.manualQuestionGrade.upsert({
        where: { attemptAnswerId: answer.id },
        create: {
          examResultId: result.id,
          attemptAnswerId: answer.id,
          gradedById: actor.id,
          score: dto.score,
          feedback: dto.feedback?.trim() || null,
        },
        update: {
          gradedById: actor.id,
          score: dto.score,
          feedback: dto.feedback?.trim() || null,
        },
      });
      const grades = await tx.manualQuestionGrade.findMany({
        where: { examResultId: result.id },
        select: { score: true },
      });
      const manualTotal = grades.reduce((sum, item) => sum + Number(item.score), 0);
      const essayCount = result.attempt.participant.examPaper.questions.filter((question) =>
        (question.questionSnapshot as { type?: string }).type === 'ESSAY',
      ).length;
      const complete = grades.length === essayCount;
      const finalScore = objectiveScore + manualTotal;
      const updated = await tx.examResult.update({
        where: { id: result.id },
        data: {
          rawScore: finalScore,
          finalScore,
          status: complete ? 'GRADED' : 'DRAFT',
          gradedById: complete ? actor.id : null,
          gradedAt: complete ? new Date() : null,
        },
      });
      await tx.auditLog.create({
        data: {
          actorUserId: actor.id,
          action: 'ESSAY_ANSWER_GRADED',
          entityType: 'EXAM_RESULT',
          entityId: result.id,
          description: `Jawaban esai dinilai ${dto.score} dari ${maxPoints} poin.`,
          ipAddress: actor.ipAddress,
          userAgent: actor.userAgent,
          oldData: existing ? { score: Number(existing.score) } : null,
          newData: { answerId, score: dto.score, maxPoints, complete },
        },
      });
      return { id: updated.id, status: updated.status, rawScore: Number(updated.rawScore), finalScore: Number(updated.finalScore), maxScore: Number(updated.maxScore), gradedEssayCount: grades.length, essayCount };
    });
  }

  async publish(resultId: string, actor: Actor) {
    return this.prisma.$transaction(async (tx) => {
      const result = await tx.examResult.findUnique({ where: { id: resultId } });
      if (!result) throw new NotFoundException('Hasil ujian tidak ditemukan.');
      await this.assertResultAccess(result, actor);
      if (result.status !== 'GRADED') throw new ConflictException('Semua soal esai harus selesai dinilai sebelum hasil diterbitkan.');
      const publishedAt = new Date();
      const updated = await tx.examResult.update({
        where: { id: resultId },
        data: { status: 'PUBLISHED', publishedAt },
      });
      await tx.auditLog.create({
        data: {
          actorUserId: actor.id,
          action: 'EXAM_RESULT_PUBLISHED',
          entityType: 'EXAM_RESULT',
          entityId: resultId,
          description: 'Hasil ujian diterbitkan kepada peserta.',
          ipAddress: actor.ipAddress,
          userAgent: actor.userAgent,
          oldData: { status: result.status },
          newData: { status: updated.status, publishedAt },
        },
      });
      return { id: updated.id, status: updated.status, publishedAt: updated.publishedAt };
    });
  }

  async studentResults(actor: Actor) {
    const profile = await this.prisma.studentProfile.findUnique({
      where: { userId: actor.id },
      select: { id: true },
    });
    if (!profile) throw new ForbiddenException('Profil siswa tidak ditemukan.');
    const results = await this.prisma.examResult.findMany({
      where: { status: 'PUBLISHED', attempt: { participant: { studentProfileId: profile.id } } },
      orderBy: { publishedAt: 'desc' },
      include: {
        subject: { select: { name: true } },
        schoolClass: { select: { name: true } },
        attempt: { include: { participant: { include: { examSchedule: { include: { exam: { select: { name: true } } } } } } } },
      },
    });
    return results.map((result) => ({
      id: result.id,
      examName: result.attempt.participant.examSchedule.exam.name,
      subjectName: result.subject.name,
      className: result.schoolClass.name,
      rawScore: Number(result.rawScore),
      finalScore: Number(result.finalScore),
      maxScore: Number(result.maxScore),
      publishedAt: result.publishedAt,
    }));
  }
}
