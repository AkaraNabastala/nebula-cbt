import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateAcademicYearDto } from './dto/create-academic-year.dto.js';
import type { CreateSubjectDto } from './dto/create-subject.dto.js';
import type { CreateClassDto } from './dto/create-class.dto.js';

type Actor = { id: string; ipAddress?: string; userAgent?: string };

@Injectable()
export class AcademicService {
  constructor(private readonly prisma: PrismaService) {}

  listYears() {
    return this.prisma.academicYear.findMany({
      orderBy: [{ isActive: 'desc' }, { startDate: 'desc' }],
      include: { _count: { select: { classes: true } } },
    });
  }

  async createYear(dto: CreateAcademicYearDto, actor: Actor) {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    if (Number.isNaN(startDate.valueOf()) || Number.isNaN(endDate.valueOf()) || startDate >= endDate) {
      throw new BadRequestException('Tanggal akhir harus setelah tanggal mulai.');
    }
    try {
      return await this.prisma.$transaction(async (tx) => {
        const year = await tx.academicYear.create({
          data: { name: dto.name.trim(), startDate, endDate },
        });
        await tx.auditLog.create({
          data: {
            actorUserId: actor.id, action: 'ACADEMIC_YEAR_CREATED',
            entityType: 'ACADEMIC_YEAR', entityId: year.id,
            description: `Tahun ajaran ${year.name} dibuat.`,
            ipAddress: actor.ipAddress, userAgent: actor.userAgent,
            newData: { name: year.name, startDate: dto.startDate, endDate: dto.endDate },
          },
        });
        return year;
      });
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
        throw new ConflictException('Nama tahun ajaran sudah digunakan.');
      }
      throw error;
    }
  }

  async activateYear(id: string, actor: Actor) {
    return this.prisma.$transaction(async (tx) => {
      const year = await tx.academicYear.findUnique({ where: { id } });
      if (!year) throw new NotFoundException('Tahun ajaran tidak ditemukan.');
      await tx.academicYear.updateMany({ where: { isActive: true }, data: { isActive: false } });
      const active = await tx.academicYear.update({ where: { id }, data: { isActive: true } });
      await tx.auditLog.create({
        data: {
          actorUserId: actor.id, action: 'ACADEMIC_YEAR_ACTIVATED',
          entityType: 'ACADEMIC_YEAR', entityId: id,
          description: `Tahun ajaran ${active.name} diaktifkan.`,
          ipAddress: actor.ipAddress, userAgent: actor.userAgent,
          oldData: { isActive: year.isActive }, newData: { isActive: true },
        },
      });
      return active;
    });
  }

  listSubjects() {
    return this.prisma.subject.findMany({
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
      include: { _count: { select: { teacherAssignments: true, questionBanks: true } } },
    });
  }

  async createSubject(dto: CreateSubjectDto, actor: Actor) {
    const name = dto.name.trim();
    if (!name) throw new BadRequestException('Nama mata pelajaran wajib diisi.');
    try {
      return await this.prisma.$transaction(async (tx) => {
        const subject = await tx.subject.create({
          data: { name, code: dto.code?.trim().toUpperCase() || null },
        });
        await tx.auditLog.create({
          data: {
            actorUserId: actor.id, action: 'SUBJECT_CREATED',
            entityType: 'SUBJECT', entityId: subject.id,
            description: `Mata pelajaran ${subject.name} dibuat.`,
            ipAddress: actor.ipAddress, userAgent: actor.userAgent,
            newData: { name: subject.name, code: subject.code },
          },
        });
        return subject;
      });
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
        throw new ConflictException('Kode mata pelajaran sudah digunakan.');
      }
      throw error;
    }
  }

  listClasses(academicYearId?: string) {
    return this.prisma.schoolClass.findMany({
      where: academicYearId ? { academicYearId } : undefined,
      orderBy: [{ gradeLevel: 'asc' }, { name: 'asc' }],
      include: {
        academicYear: { select: { id: true, name: true, isActive: true } },
        homeroomTeacher: { select: { id: true, user: { select: { fullName: true } } } },
        _count: { select: { enrollments: true, teacherAssignments: true } },
      },
    });
  }

  async createClass(dto: CreateClassDto, actor: Actor) {
    const year = await this.prisma.academicYear.findUnique({ where: { id: dto.academicYearId } });
    if (!year) throw new NotFoundException('Tahun ajaran tidak ditemukan.');
    if (dto.homeroomTeacherId) {
      const teacher = await this.prisma.teacherProfile.findUnique({ where: { id: dto.homeroomTeacherId } });
      if (!teacher) throw new NotFoundException('Profil guru wali tidak ditemukan.');
    }
    try {
      return await this.prisma.$transaction(async (tx) => {
        const schoolClass = await tx.schoolClass.create({
          data: {
            name: dto.name.trim(), gradeLevel: dto.gradeLevel,
            academicYearId: dto.academicYearId,
            homeroomTeacherId: dto.homeroomTeacherId || null,
          },
        });
        await tx.auditLog.create({
          data: {
            actorUserId: actor.id, action: 'CLASS_CREATED',
            entityType: 'CLASS', entityId: schoolClass.id,
            description: `Kelas ${schoolClass.name} dibuat untuk ${year.name}.`,
            ipAddress: actor.ipAddress, userAgent: actor.userAgent,
            newData: { name: schoolClass.name, gradeLevel: schoolClass.gradeLevel, academicYearId: year.id },
          },
        });
        return schoolClass;
      });
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
        throw new ConflictException('Nama kelas sudah digunakan pada tahun ajaran ini.');
      }
      throw error;
    }
  }
}
