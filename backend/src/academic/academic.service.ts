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

  async getEducationSettings() {
    const setting = await this.prisma.systemSetting.findUnique({ where: { key: 'education_structure' } });
    return setting?.value ?? { institutionType: 'Sekolah / lembaga pendidikan', institutionName: '', logoDataUrl: '', educationLevel: 'Belum ditentukan', departmentsEnabled: false, departments: [] };
  }

  async getInstitutionBranding() {
    const setting = await this.prisma.systemSetting.findUnique({ where: { key: 'education_structure' } });
    const value = setting?.value as { institutionName?: string; logoDataUrl?: string } | undefined;
    return { institutionName: value?.institutionName ?? '', logoDataUrl: value?.logoDataUrl ?? '' };
  }

  async updateEducationSettings(input: unknown, actor: Actor) {
    const existing = await this.prisma.systemSetting.findUnique({ where: { key: 'education_structure' } });
    const current = existing?.value as { educationLevel?: string } | undefined;
    if (current?.educationLevel && current.educationLevel !== 'Belum ditentukan' && current.institutionName) {
      throw new ConflictException('Setup lembaga sudah selesai. Jenjang tidak dapat diubah dari halaman setup.');
    }
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new BadRequestException('Pengaturan lembaga tidak valid.');
    const value = input as Record<string, unknown>;
    const institutionType = typeof value.institutionType === 'string' ? value.institutionType.trim() : '';
    const educationLevel = typeof value.educationLevel === 'string' ? value.educationLevel.trim() : '';
    const institutionName = typeof value.institutionName === 'string' ? value.institutionName.trim() : '';
    const logoDataUrl = typeof value.logoDataUrl === 'string' ? value.logoDataUrl : '';
    const departmentsEnabled = value.departmentsEnabled === true;
    const departments = Array.isArray(value.departments) ? value.departments : [];
    if (!institutionType || institutionType.length > 80 || !educationLevel || educationLevel.length > 80 || !institutionName || institutionName.length > 160) throw new BadRequestException('Nama lembaga, jenis lembaga, dan jenjang wajib diisi.');
    if (current?.educationLevel && current.educationLevel !== 'Belum ditentukan' && current.educationLevel !== educationLevel) throw new ConflictException('Jenjang pendidikan dikunci setelah setup awal.');
    if (logoDataUrl && (logoDataUrl.length > 400_000 || !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/.test(logoDataUrl))) throw new BadRequestException('Logo harus berupa PNG, JPG, atau WebP dengan ukuran maksimal 250 KB.');
    if (departments.length > 200 || departments.some((item) => typeof item !== 'string' || !item.trim() || item.trim().length > 120)) throw new BadRequestException('Daftar jurusan tidak valid.');
    const normalizedDepartments = [...new Set((departments as string[]).map((item) => item.trim()))];
    const nextValue = { institutionType, institutionName, logoDataUrl, educationLevel, departmentsEnabled, departments: normalizedDepartments };
    return this.prisma.$transaction(async (tx) => {
      const setting = await tx.systemSetting.upsert({
        where: { key: 'education_structure' },
        create: { key: 'education_structure', value: nextValue, description: 'Konfigurasi jenjang dan pengelompokan lembaga CBT', updatedById: actor.id },
        update: { value: nextValue, updatedById: actor.id },
      });
      await tx.auditLog.create({ data: { actorUserId: actor.id, action: 'EDUCATION_STRUCTURE_UPDATED', entityType: 'SYSTEM_SETTING', entityId: setting.id, description: 'Konfigurasi jenjang pendidikan dan jurusan diperbarui.', newData: nextValue } });
      return setting.value;
    });
  }

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
          data: { name, code: dto.code?.trim().toUpperCase() || null, category: dto.category?.trim() || "Umum" },
        });
        await tx.auditLog.create({
          data: {
            actorUserId: actor.id, action: 'SUBJECT_CREATED',
            entityType: 'SUBJECT', entityId: subject.id,
            description: `Mata pelajaran ${subject.name} dibuat.`,
            ipAddress: actor.ipAddress, userAgent: actor.userAgent,
            newData: { name: subject.name, code: subject.code, category: subject.category },
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
    if (dto.departmentName?.trim()) {
      const settings = await this.getEducationSettings() as { departmentsEnabled?: boolean; departments?: unknown[] };
      if (!settings.departmentsEnabled || !Array.isArray(settings.departments) || !settings.departments.includes(dto.departmentName.trim())) {
        throw new BadRequestException('Jurusan tidak aktif atau belum terdaftar pada pengaturan lembaga.');
      }
    }
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
            departmentName: dto.departmentName?.trim() || null,
            homeroomTeacherId: dto.homeroomTeacherId || null,
          },
        });
        await tx.auditLog.create({
          data: {
            actorUserId: actor.id, action: 'CLASS_CREATED',
            entityType: 'CLASS', entityId: schoolClass.id,
            description: `Kelas ${schoolClass.name} dibuat untuk ${year.name}.`,
            ipAddress: actor.ipAddress, userAgent: actor.userAgent,
            newData: { name: schoolClass.name, gradeLevel: schoolClass.gradeLevel, academicYearId: year.id, departmentName: schoolClass.departmentName },
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
