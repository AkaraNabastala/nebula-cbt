import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateExamDto } from './dto/create-exam.dto.js';

type Actor = { id: string; roles: string[]; ipAddress?: string; userAgent?: string };

@Injectable()
export class ExamOperationsService {
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

  async options(actor: Actor) {
    const teacherProfileId = this.isAdmin(actor) ? undefined : await this.teacherProfileId(actor);
    const [assessmentTypes, academicYears, subjects, classes, classAssignments] = await Promise.all([
      this.prisma.assessmentType.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
        select: { id: true, code: true, name: true },
      }),
      this.prisma.academicYear.findMany({
        where: this.isAdmin(actor) ? undefined : { isActive: true },
        orderBy: [{ isActive: 'desc' }, { startDate: 'desc' }],
        select: { id: true, name: true, isActive: true, startDate: true, endDate: true },
      }),
      this.prisma.subject.findMany({
        where: this.isAdmin(actor) ? { isActive: true } : {
          isActive: true,
          teacherAssignments: { some: { teacherProfileId, isActive: true, class: { academicYear: { isActive: true } } } },
        },
        orderBy: { name: 'asc' },
        select: { id: true, name: true, code: true },
      }),
      this.prisma.schoolClass.findMany({
        where: this.isAdmin(actor) ? undefined : {
          academicYear: { isActive: true },
          teacherAssignments: { some: { teacherProfileId, isActive: true } },
        },
        orderBy: [{ gradeLevel: 'asc' }, { name: 'asc' }],
        select: { id: true, name: true, gradeLevel: true, academicYearId: true, academicYear: { select: { name: true, isActive: true } } },
      }),
      teacherProfileId
        ? this.prisma.teacherAssignment.findMany({
            where: { teacherProfileId, isActive: true, class: { academicYear: { isActive: true } } },
            select: { subjectId: true, classId: true },
          })
        : Promise.resolve([]),
    ]);
    return { assessmentTypes, academicYears, subjects, classes, classAssignments };
  }

  async list(actor: Actor) {
    const teacherProfileId = this.isAdmin(actor) ? undefined : await this.teacherProfileId(actor);
    return this.prisma.exam.findMany({
      where: this.isAdmin(actor) ? undefined : {
        subject: {
          teacherAssignments: {
            some: { teacherProfileId, isActive: true, class: { academicYear: { isActive: true } } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        subject: { select: { id: true, name: true } },
        assessmentEvent: { select: { id: true, name: true, status: true, academicYear: { select: { name: true } } } },
        schedules: {
          include: {
            defaultExamPaper: { select: { id: true, name: true, status: true, totalQuestions: true, maxScore: true } },
            _count: { select: { participants: true } },
          },
        },
      },
    });
  }

  async create(dto: CreateExamDto, actor: Actor) {
    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);
    if (Number.isNaN(startsAt.valueOf()) || Number.isNaN(endsAt.valueOf()) || startsAt >= endsAt) {
      throw new BadRequestException('Waktu selesai harus setelah waktu mulai.');
    }
    if (dto.durationMinutes > Math.ceil((endsAt.getTime() - startsAt.getTime()) / 60000)) {
      throw new BadRequestException('Durasi ujian tidak boleh melebihi rentang waktu sesi.');
    }
    if (new Set(dto.classIds).size !== dto.classIds.length || new Set(dto.questionIds).size !== dto.questionIds.length) {
      throw new BadRequestException('Daftar kelas dan soal tidak boleh berisi duplikat.');
    }

    const year = await this.prisma.academicYear.findUnique({ where: { id: dto.academicYearId } });
    if (!year) throw new NotFoundException('Tahun ajaran tidak ditemukan.');
    const subject = await this.prisma.subject.findUnique({ where: { id: dto.subjectId } });
    if (!subject?.isActive) throw new NotFoundException('Mata pelajaran aktif tidak ditemukan.');
    const assessmentType = await this.prisma.assessmentType.findFirst({
      where: { id: dto.assessmentTypeId, isActive: true },
      select: { id: true },
    });
    if (!assessmentType) throw new NotFoundException('Jenis asesmen aktif tidak ditemukan.');

    const classRows = await this.prisma.schoolClass.findMany({
      where: { id: { in: dto.classIds }, academicYearId: dto.academicYearId },
      select: { id: true },
    });
    if (classRows.length !== dto.classIds.length) {
      throw new BadRequestException('Semua kelas harus berasal dari tahun ajaran yang dipilih.');
    }

    if (!this.isAdmin(actor)) {
      const teacherProfileId = await this.teacherProfileId(actor);
      const assignments = await this.prisma.teacherAssignment.findMany({
        where: {
          teacherProfileId,
          subjectId: dto.subjectId,
          classId: { in: dto.classIds },
          isActive: true,
          class: { academicYearId: dto.academicYearId, academicYear: { isActive: true } },
        },
        select: { classId: true },
      });
      if (new Set(assignments.map((item) => item.classId)).size !== dto.classIds.length) {
        throw new ForbiddenException('Anda hanya dapat menjadwalkan kelas pada mata pelajaran yang ditugaskan.');
      }
    }

    const questions = await this.prisma.question.findMany({
      where: {
        id: { in: dto.questionIds },
        status: 'PUBLISHED',
        questionBank: { subjectId: dto.subjectId, isActive: true },
      },
      orderBy: { createdAt: 'asc' },
      include: {
        options: { orderBy: { sortOrder: 'asc' }, select: { id: true, label: true, content: true } },
        answerKey: { select: { answerData: true, gradingGuide: true } },
      },
    });
    if (questions.length !== dto.questionIds.length) {
      throw new BadRequestException('Semua soal harus berstatus terbit dan berasal dari mata pelajaran yang dipilih.');
    }
    if (questions.some((question) => !question.answerKey)) {
      throw new BadRequestException('Setiap soal harus memiliki kunci jawaban atau pedoman penilaian.');
    }

    const questionOrder = new Map(dto.questionIds.map((id, index) => [id, index]));
    questions.sort((left, right) => (questionOrder.get(left.id) ?? 0) - (questionOrder.get(right.id) ?? 0));
    const maxScore = questions.reduce((total, question) => total + Number(question.defaultPoints), 0);
    const schoolSettings = await this.prisma.schoolSettings.findUnique({ where: { id: 'main' }, select: { timezone: true } });
    const timezone = schoolSettings?.timezone || 'Asia/Jakarta';
    const schoolDate = (value: Date) => {
      const parts = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(value);
      return new Date(`${parts}T00:00:00.000Z`);
    };
    const startDate = schoolDate(startsAt);
    const endDate = schoolDate(endsAt);
    if (startDate < year.startDate || endDate > year.endDate) {
      throw new BadRequestException('Jadwal ujian harus berada dalam rentang tahun ajaran yang dipilih.');
    }

    return this.prisma.$transaction(async (tx) => {
      const event = await tx.assessmentEvent.create({
        data: {
          name: dto.name.trim(),
          description: dto.description?.trim() || null,
          assessmentTypeId: dto.assessmentTypeId,
          academicYearId: dto.academicYearId,
          startDate,
          endDate,
          createdById: actor.id,
        },
      });
      const exam = await tx.exam.create({
        data: {
          assessmentEventId: event.id,
          subjectId: dto.subjectId,
          name: dto.name.trim(),
          description: dto.description?.trim() || null,
          createdById: actor.id,
        },
      });
      const paper = await tx.examPaper.create({
        data: {
          name: `Paket utama: ${dto.name.trim()}`,
          description: 'Snapshot soal dibuat saat ujian disusun.',
          subjectId: dto.subjectId,
          createdById: actor.id,
          totalQuestions: questions.length,
          maxScore,
          shuffleQuestions: dto.shuffleQuestions,
          shuffleOptions: dto.shuffleOptions,
          questions: {
            create: questions.map((question, index) => ({
              sourceQuestionId: question.id,
              questionSnapshot: {
                type: question.type,
                difficulty: question.difficulty,
                content: question.content,
                options: question.options.map((option) => ({ id: option.id, label: option.label, content: option.content })),
              } as Prisma.InputJsonValue,
              answerKeySnapshot: {
                type: question.type,
                answerData: question.answerKey!.answerData,
                gradingGuide: question.answerKey!.gradingGuide,
              } as Prisma.InputJsonValue,
              points: question.defaultPoints,
              sortOrder: index,
            })),
          },
        },
      });
      const schedule = await tx.examSchedule.create({
        data: {
          examId: exam.id,
          defaultExamPaperId: paper.id,
          sessionName: dto.sessionName.trim(),
          sessionNumber: 1,
          startsAt,
          endsAt,
          durationMinutes: dto.durationMinutes,
          scheduleClasses: { create: dto.classIds.map((schoolClassId) => ({ schoolClassId })) },
        },
      });
      await tx.auditLog.create({
        data: {
          actorUserId: actor.id,
          action: 'EXAM_DRAFT_CREATED',
          entityType: 'EXAM',
          entityId: exam.id,
          description: `Draf ujian ${exam.name} dibuat untuk ${dto.classIds.length} kelas.`,
          ipAddress: actor.ipAddress,
          userAgent: actor.userAgent,
          newData: { examId: exam.id, scheduleId: schedule.id, paperId: paper.id, classIds: dto.classIds, questionIds: dto.questionIds },
        },
      });
      return {
        id: exam.id,
        name: exam.name,
        status: exam.status,
        assessmentEventId: event.id,
        scheduleId: schedule.id,
        examPaperId: paper.id,
        totalQuestions: questions.length,
        maxScore,
      };
    });
  }

  async publish(examId: string, actor: Actor) {
    return this.prisma.$transaction(async (tx) => {
      const exam = await tx.exam.findUnique({
        where: { id: examId },
        include: {
          assessmentEvent: true,
          schedules: {
            include: {
              defaultExamPaper: { include: { _count: { select: { questions: true } } } },
              scheduleClasses: { select: { schoolClassId: true } },
            },
          },
        },
      });
      if (!exam) throw new NotFoundException('Ujian tidak ditemukan.');
      if (!this.isAdmin(actor)) {
        const teacherProfileId = await this.teacherProfileId(actor);
        const classes = exam.schedules.flatMap((schedule) => schedule.scheduleClasses.map((item) => item.schoolClassId));
        const assignments = await tx.teacherAssignment.findMany({
          where: { teacherProfileId, subjectId: exam.subjectId, classId: { in: classes }, isActive: true, class: { academicYear: { isActive: true } } },
          select: { classId: true },
        });
        if (new Set(assignments.map((item) => item.classId)).size !== classes.length) {
          throw new ForbiddenException('Anda tidak memiliki akses untuk menerbitkan ujian ini.');
        }
      }
      if (exam.status === 'PUBLISHED') {
        const count = await tx.examParticipant.count({ where: { examSchedule: { examId } } });
        return { id: exam.id, status: exam.status, participantCount: count, alreadyPublished: true };
      }
      if (exam.status !== 'DRAFT' || exam.schedules.length !== 1) {
        throw new ConflictException('Ujian tidak berada pada status draf yang dapat diterbitkan.');
      }
      const schedule = exam.schedules[0];
      const paper = schedule.defaultExamPaper;
      if (!paper || paper._count.questions === 0) {
        throw new BadRequestException('Paket ujian belum memiliki soal.');
      }
      const classIds = schedule.scheduleClasses.map((item) => item.schoolClassId);
      const enrollments = await tx.studentClass.findMany({
        where: {
          classId: { in: classIds },
          leftAt: null,
          student: { user: { status: 'ACTIVE' } },
        },
        select: { studentProfileId: true, classId: true },
      });
      const now = new Date();
      await tx.examPaper.update({ where: { id: paper.id }, data: { status: 'PUBLISHED', publishedAt: now } });
      await tx.examSchedule.update({ where: { id: schedule.id }, data: { status: 'PUBLISHED' } });
      await tx.exam.update({ where: { id: exam.id }, data: { status: 'PUBLISHED' } });
      await tx.assessmentEvent.update({ where: { id: exam.assessmentEventId }, data: { status: 'PUBLISHED' } });
      if (enrollments.length) {
        await tx.examParticipant.createMany({
          data: enrollments.map((enrollment) => ({
            examScheduleId: schedule.id,
            studentProfileId: enrollment.studentProfileId,
            examPaperId: paper.id,
            schoolClassId: enrollment.classId,
          })),
          skipDuplicates: true,
        });
      }
      const participantCount = await tx.examParticipant.count({ where: { examScheduleId: schedule.id } });
      await tx.auditLog.create({
        data: {
          actorUserId: actor.id,
          action: 'EXAM_PUBLISHED',
          entityType: 'EXAM',
          entityId: exam.id,
          description: `Ujian ${exam.name} diterbitkan untuk ${participantCount} peserta.`,
          ipAddress: actor.ipAddress,
          userAgent: actor.userAgent,
          oldData: { status: exam.status },
          newData: { status: 'PUBLISHED', participantCount, paperId: paper.id },
        },
      });
      return { id: exam.id, status: 'PUBLISHED', participantCount, alreadyPublished: false };
    });
  }
}
