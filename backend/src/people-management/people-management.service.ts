import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateEnrollmentDto } from './dto/create-enrollment.dto.js';
import type { CreateTeacherAssignmentDto } from './dto/create-teacher-assignment.dto.js';

type Actor = { id: string; roles: string[]; ipAddress?: string; userAgent?: string };

@Injectable()
export class PeopleManagementService {
  constructor(private readonly prisma: PrismaService) {}

  private assertAdmin(actor: Actor) {
    if (!actor.roles.includes('ADMIN')) throw new ForbiddenException('Hanya administrator yang dapat mengelola penempatan akademik.');
  }

  async options(actor: Actor) {
    this.assertAdmin(actor);
    const [students, teachers, classes, subjects] = await Promise.all([
      this.prisma.studentProfile.findMany({
        where: { user: { status: 'ACTIVE' } },
        orderBy: { user: { fullName: 'asc' } },
        select: { id: true, user: { select: { fullName: true } } },
      }),
      this.prisma.teacherProfile.findMany({
        where: { user: { status: 'ACTIVE' } },
        orderBy: { user: { fullName: 'asc' } },
        select: { id: true, user: { select: { fullName: true } } },
      }),
      this.prisma.schoolClass.findMany({
        where: { academicYear: { isActive: true } },
        orderBy: [{ gradeLevel: 'asc' }, { name: 'asc' }],
        select: { id: true, name: true, gradeLevel: true, academicYear: { select: { name: true } } },
      }),
      this.prisma.subject.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
        select: { id: true, name: true, code: true },
      }),
    ]);
    return { students, teachers, classes, subjects };
  }

  async listEnrollments(actor: Actor) {
    this.assertAdmin(actor);
    return this.prisma.studentClass.findMany({
      orderBy: { joinedAt: 'desc' },
      include: {
        student: { include: { user: { select: { fullName: true } } } },
        class: { include: { academicYear: { select: { name: true } } } },
      },
    });
  }

  async createEnrollment(dto: CreateEnrollmentDto, actor: Actor) {
    this.assertAdmin(actor);
    const [student, schoolClass] = await Promise.all([
      this.prisma.studentProfile.findUnique({ where: { id: dto.studentProfileId }, include: { user: { select: { status: true } } } }),
      this.prisma.schoolClass.findUnique({ where: { id: dto.classId }, include: { academicYear: { select: { id: true, isActive: true } } } }),
    ]);
    if (!student || student.user.status !== 'ACTIVE') throw new NotFoundException('Siswa aktif tidak ditemukan.');
    if (!schoolClass || !schoolClass.academicYear.isActive) throw new NotFoundException('Kelas pada tahun ajaran aktif tidak ditemukan.');
    const existing = await this.prisma.studentClass.findFirst({
      where: {
        studentProfileId: dto.studentProfileId,
        leftAt: null,
        class: { academicYearId: schoolClass.academicYear.id },
      },
      select: { id: true },
    });
    if (existing) throw new ConflictException('Siswa sudah terdaftar pada kelas lain di tahun ajaran ini.');
    return this.prisma.$transaction(async (tx) => {
      const enrollment = await tx.studentClass.create({
        data: { studentProfileId: dto.studentProfileId, classId: dto.classId },
        include: {
          student: { include: { user: { select: { fullName: true } } } },
          class: { include: { academicYear: { select: { name: true } } } },
        },
      });
      await tx.auditLog.create({
        data: {
          actorUserId: actor.id,
          action: 'STUDENT_ENROLLED',
          entityType: 'STUDENT_CLASS',
          entityId: enrollment.id,
          description: `${enrollment.student.user.fullName} ditempatkan di kelas ${enrollment.class.name}.`,
          ipAddress: actor.ipAddress,
          userAgent: actor.userAgent,
          newData: { studentProfileId: dto.studentProfileId, classId: dto.classId },
        },
      });
      return enrollment;
    });
  }

  async leaveEnrollment(id: string, actor: Actor) {
    this.assertAdmin(actor);
    const enrollment = await this.prisma.studentClass.findUnique({
      where: { id },
      include: { student: { include: { user: { select: { fullName: true } } } }, class: true },
    });
    if (!enrollment) throw new NotFoundException('Penempatan siswa tidak ditemukan.');
    if (enrollment.leftAt) return enrollment;
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.studentClass.update({ where: { id }, data: { leftAt: new Date() } });
      await tx.auditLog.create({
        data: {
          actorUserId: actor.id,
          action: 'STUDENT_LEFT_CLASS',
          entityType: 'STUDENT_CLASS',
          entityId: id,
          description: `${enrollment.student.user.fullName} keluar dari kelas ${enrollment.class.name}.`,
          ipAddress: actor.ipAddress,
          userAgent: actor.userAgent,
          oldData: { leftAt: null },
          newData: { leftAt: updated.leftAt },
        },
      });
      return updated;
    });
  }

  async listTeacherAssignments(actor: Actor) {
    this.assertAdmin(actor);
    return this.prisma.teacherAssignment.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        teacher: { include: { user: { select: { fullName: true } } } },
        subject: { select: { name: true, code: true } },
        class: { include: { academicYear: { select: { name: true } } } },
      },
    });
  }

  async createTeacherAssignment(dto: CreateTeacherAssignmentDto, actor: Actor) {
    this.assertAdmin(actor);
    const [teacher, subject, schoolClass] = await Promise.all([
      this.prisma.teacherProfile.findUnique({ where: { id: dto.teacherProfileId }, include: { user: { select: { status: true } } } }),
      this.prisma.subject.findUnique({ where: { id: dto.subjectId }, select: { id: true, isActive: true } }),
      this.prisma.schoolClass.findUnique({ where: { id: dto.classId }, include: { academicYear: { select: { isActive: true } } } }),
    ]);
    if (!teacher || teacher.user.status !== 'ACTIVE') throw new NotFoundException('Guru aktif tidak ditemukan.');
    if (!subject?.isActive) throw new NotFoundException('Mata pelajaran aktif tidak ditemukan.');
    if (!schoolClass?.academicYear.isActive) throw new NotFoundException('Kelas pada tahun ajaran aktif tidak ditemukan.');
    return this.prisma.$transaction(async (tx) => {
      const assignment = await tx.teacherAssignment.upsert({
        where: {
          teacherProfileId_subjectId_classId: {
            teacherProfileId: dto.teacherProfileId,
            subjectId: dto.subjectId,
            classId: dto.classId,
          },
        },
        create: {
          teacherProfileId: dto.teacherProfileId,
          subjectId: dto.subjectId,
          classId: dto.classId,
          isActive: true,
        },
        update: { isActive: true },
        include: {
          teacher: { include: { user: { select: { fullName: true } } } },
          subject: { select: { name: true } },
          class: { select: { name: true } },
        },
      });
      await tx.auditLog.create({
        data: {
          actorUserId: actor.id,
          action: 'TEACHER_ASSIGNMENT_CREATED',
          entityType: 'TEACHER_ASSIGNMENT',
          entityId: assignment.id,
          description: `${assignment.teacher.user.fullName} ditugaskan pada ${assignment.subject.name} — ${assignment.class.name}.`,
          ipAddress: actor.ipAddress,
          userAgent: actor.userAgent,
          newData: { teacherProfileId: dto.teacherProfileId, subjectId: dto.subjectId, classId: dto.classId },
        },
      });
      return assignment;
    });
  }

  async updateTeacherAssignmentStatus(id: string, isActive: boolean, actor: Actor) {
    this.assertAdmin(actor);
    return this.prisma.$transaction(async (tx) => {
      const assignment = await tx.teacherAssignment.findUnique({ where: { id } });
      if (!assignment) throw new NotFoundException('Penugasan guru tidak ditemukan.');
      if (assignment.isActive === isActive) return assignment;
      const updated = await tx.teacherAssignment.update({ where: { id }, data: { isActive } });
      await tx.auditLog.create({
        data: {
          actorUserId: actor.id,
          action: 'TEACHER_ASSIGNMENT_STATUS_CHANGED',
          entityType: 'TEACHER_ASSIGNMENT',
          entityId: id,
          description: `Status penugasan guru diubah menjadi ${isActive ? 'aktif' : 'nonaktif'}.`,
          ipAddress: actor.ipAddress,
          userAgent: actor.userAgent,
          oldData: { isActive: assignment.isActive },
          newData: { isActive },
        },
      });
      return updated;
    });
  }
}
