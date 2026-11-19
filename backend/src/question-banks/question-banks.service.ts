import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateQuestionBankDto } from './dto/create-question-bank.dto.js';
import type { CreateQuestionDto } from './dto/create-question.dto.js';

type Actor = { id: string; roles: string[]; ipAddress?: string; userAgent?: string };

const CHOICE_TYPES = new Set(['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE']);

@Injectable()
export class QuestionBanksService {
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

  private async assertSubjectAccess(subjectId: string, actor: Actor) {
    if (this.isAdmin(actor)) return;
    const teacherProfileId = await this.teacherProfileId(actor);
    const assignment = await this.prisma.teacherAssignment.findFirst({
      where: { teacherProfileId, subjectId, isActive: true, class: { academicYear: { isActive: true } } },
      select: { id: true },
    });
    if (!assignment) throw new ForbiddenException('Mata pelajaran ini belum ditugaskan kepada Anda pada tahun ajaran aktif.');
  }

  private async assertBankAccess(bankId: string, actor: Actor) {
    const bank = await this.prisma.questionBank.findUnique({
      where: { id: bankId },
      select: { id: true, subjectId: true, name: true },
    });
    if (!bank) throw new NotFoundException('Bank soal tidak ditemukan.');
    await this.assertSubjectAccess(bank.subjectId, actor);
    return bank;
  }

  async listSubjects(actor: Actor) {
    if (this.isAdmin(actor)) {
      return this.prisma.subject.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
        select: { id: true, code: true, name: true },
      });
    }
    const teacherProfileId = await this.teacherProfileId(actor);
    return this.prisma.subject.findMany({
      where: {
        isActive: true,
        teacherAssignments: {
          some: {
            teacherProfileId,
            isActive: true,
            class: { academicYear: { isActive: true } },
          },
        },
      },
      orderBy: { name: 'asc' },
      select: { id: true, code: true, name: true },
    });
  }

  async listBanks(actor: Actor) {
    const subjectIds = this.isAdmin(actor)
      ? undefined
      : (await this.listSubjects(actor)).map((subject) => subject.id);
    return this.prisma.questionBank.findMany({
      where: subjectIds ? { subjectId: { in: subjectIds } } : undefined,
      orderBy: [{ updatedAt: 'desc' }, { name: 'asc' }],
      include: {
        subject: { select: { id: true, code: true, name: true } },
        _count: { select: { questions: true } },
      },
    });
  }

  async createBank(dto: CreateQuestionBankDto, actor: Actor) {
    await this.assertSubjectAccess(dto.subjectId, actor);
    const name = dto.name.trim();
    if (!name) throw new BadRequestException('Nama bank soal wajib diisi.');
    try {
      return await this.prisma.$transaction(async (tx) => {
        const bank = await tx.questionBank.create({
          data: {
            name,
            description: dto.description?.trim() || null,
            subjectId: dto.subjectId,
            createdById: actor.id,
          },
          include: { subject: { select: { id: true, code: true, name: true } } },
        });
        await tx.auditLog.create({
          data: {
            actorUserId: actor.id,
            action: 'QUESTION_BANK_CREATED',
            entityType: 'QUESTION_BANK',
            entityId: bank.id,
            description: `Bank soal ${bank.name} dibuat.`,
            ipAddress: actor.ipAddress,
            userAgent: actor.userAgent,
            newData: { name: bank.name, subjectId: bank.subjectId },
          },
        });
        return bank;
      });
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
        throw new ConflictException('Nama bank soal sudah digunakan untuk mata pelajaran ini.');
      }
      throw error;
    }
  }

  async listQuestions(bankId: string, actor: Actor) {
    await this.assertBankAccess(bankId, actor);
    return this.prisma.question.findMany({
      where: { questionBankId: bankId },
      orderBy: [{ createdAt: 'desc' }],
      select: {
        id: true,
        type: true,
        difficulty: true,
        content: true,
        explanation: true,
        defaultPoints: true,
        status: true,
        createdAt: true,
        options: { orderBy: { sortOrder: 'asc' }, select: { id: true, label: true, content: true, sortOrder: true } },
        answerKey: { select: { answerData: true, gradingGuide: true } },
      },
    });
  }

  async createQuestion(bankId: string, dto: CreateQuestionDto, actor: Actor) {
    const bank = await this.assertBankAccess(bankId, actor);
    const content = dto.content.trim();
    if (!content) throw new BadRequestException('Isi soal wajib diisi.');
    const options = dto.type === 'TRUE_FALSE'
      ? [{ label: 'A', text: 'Benar' }, { label: 'B', text: 'Salah' }]
      : (dto.options ?? []).map((option) => ({ label: option.label.trim().toUpperCase(), text: option.text.trim() }));

    let answerData: Record<string, unknown>;
    if (CHOICE_TYPES.has(dto.type)) {
      if (options.length < 2 || options.some((option) => !option.label || !option.text)) {
        throw new BadRequestException('Soal pilihan harus memiliki minimal dua opsi berlabel dan berisi.');
      }
      if (new Set(options.map((option) => option.label)).size !== options.length) {
        throw new BadRequestException('Label opsi tidak boleh duplikat.');
      }
      const correctLabels = [...new Set(dto.correctLabels ?? [])].map((label) => label.trim().toUpperCase());
      if (!correctLabels.length || correctLabels.some((label) => !options.some((option) => option.label === label))) {
        throw new BadRequestException('Pilih jawaban benar dari opsi yang tersedia.');
      }
      if (dto.type !== 'MULTIPLE_CHOICE' && correctLabels.length !== 1) {
        throw new BadRequestException('Jenis soal ini hanya menerima satu jawaban benar.');
      }
      answerData = { correctLabels };
    } else if (dto.type === 'SHORT_ANSWER') {
      const acceptedAnswers = [...new Set((dto.acceptedAnswers ?? []).map((answer) => answer.trim()).filter(Boolean))];
      if (!acceptedAnswers.length) throw new BadRequestException('Isi minimal satu jawaban yang diterima.');
      answerData = { acceptedAnswers };
    } else {
      if (!dto.gradingGuide?.trim()) throw new BadRequestException('Pedoman penilaian esai wajib diisi.');
      answerData = { manualGrading: true };
    }

    return this.prisma.$transaction(async (tx) => {
      const question = await tx.question.create({
        data: {
          questionBankId: bankId,
          createdById: actor.id,
          type: dto.type,
          difficulty: dto.difficulty,
          content: { text: content },
          explanation: dto.explanation?.trim() || null,
          defaultPoints: dto.points,
          status: 'DRAFT',
          options: {
            create: options.map((option, index) => ({
              label: option.label,
              content: { text: option.text },
              sortOrder: index,
            })),
          },
          answerKey: {
            create: {
              answerData,
              gradingGuide: dto.type === 'ESSAY' ? dto.gradingGuide?.trim() : null,
            },
          },
        },
        select: { id: true, type: true, difficulty: true, content: true, defaultPoints: true, status: true, createdAt: true },
      });
      await tx.auditLog.create({
        data: {
          actorUserId: actor.id,
          action: 'QUESTION_CREATED',
          entityType: 'QUESTION',
          entityId: question.id,
          description: `Soal baru ditambahkan ke bank ${bank.name}.`,
          ipAddress: actor.ipAddress,
          userAgent: actor.userAgent,
          newData: { questionBankId: bankId, type: dto.type, difficulty: dto.difficulty, points: dto.points },
        },
      });
      return question;
    });
  }
}
