import { BadRequestException } from '@nestjs/common';
import { AcademicService } from './academic.service.js';
import type { PrismaService } from '../prisma/prisma.service.js';

describe('AcademicService education structure', () => {
  const tx = {
    systemSetting: { upsert: vi.fn() },
    schoolClass: { create: vi.fn() },
    auditLog: { create: vi.fn() },
  };
  const prisma = {
    $transaction: vi.fn(),
    systemSetting: { findUnique: vi.fn() },
    academicYear: { findUnique: vi.fn() },
    teacherProfile: { findUnique: vi.fn() },
  } as unknown as PrismaService;
  const service = new AcademicService(prisma);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.$transaction).mockImplementation(
      ((callback: (client: typeof tx) => Promise<unknown>) => callback(tx)) as never,
    );
  });

  it('returns an unconfigured structure when no setting exists', async () => {
    vi.mocked(prisma.systemSetting.findUnique).mockResolvedValue(null);

    await expect(service.getEducationSettings()).resolves.toEqual({
      institutionType: 'Sekolah / lembaga pendidikan',
      educationLevel: 'Belum ditentukan',
      departmentsEnabled: false,
      departments: [],
    });
  });

  it('stores administrator-defined departments and writes an audit record', async () => {
    const value = {
      institutionType: 'Madrasah',
      educationLevel: 'MA',
      departmentsEnabled: true,
      departments: ['IPA', 'IPS'],
    };
    vi.mocked(tx.systemSetting.upsert).mockResolvedValue({
      id: 'setting-1',
      value,
    } as never);

    await expect(service.updateEducationSettings({
      ...value,
      departments: [' IPA ', 'IPS', 'IPA'],
    }, { id: 'admin-1' })).resolves.toEqual(value);

    expect(tx.systemSetting.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { key: 'education_structure' },
      create: expect.objectContaining({ key: 'education_structure', updatedById: 'admin-1' }),
      update: expect.objectContaining({ value, updatedById: 'admin-1' }),
    }));
    expect(tx.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        actorUserId: 'admin-1',
        action: 'EDUCATION_STRUCTURE_UPDATED',
        newData: value,
      }),
    }));
  });

  it('rejects an empty institution type or invalid department names', async () => {
    await expect(service.updateEducationSettings({
      institutionType: '',
      educationLevel: 'SD/MI',
      departmentsEnabled: false,
      departments: [],
    }, { id: 'admin-1' })).rejects.toBeInstanceOf(BadRequestException);

    await expect(service.updateEducationSettings({
      institutionType: 'Sekolah',
      educationLevel: 'SD/MI',
      departmentsEnabled: true,
      departments: [''],
    }, { id: 'admin-1' })).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejects a class department that is not enabled in institution settings', async () => {
    vi.mocked(prisma.academicYear.findUnique).mockResolvedValue({
      id: 'year-1',
      name: '2026/2027',
    } as never);
    vi.mocked(prisma.systemSetting.findUnique).mockResolvedValue({
      value: { departmentsEnabled: false, departments: ['IPA'] },
    } as never);

    await expect(service.createClass({
      name: 'X A',
      gradeLevel: 10,
      academicYearId: 'year-1',
      departmentName: 'IPA',
    }, { id: 'admin-1' })).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(tx.schoolClass.create).not.toHaveBeenCalled();
  });

  it('saves a class with an enabled administrator-defined department', async () => {
    const schoolClass = {
      id: 'class-1',
      name: 'X A',
      gradeLevel: 10,
      departmentName: 'Rekayasa Perangkat Lunak',
    };
    vi.mocked(prisma.academicYear.findUnique).mockResolvedValue({
      id: 'year-1',
      name: '2026/2027',
    } as never);
    vi.mocked(prisma.systemSetting.findUnique).mockResolvedValue({
      value: {
        departmentsEnabled: true,
        departments: ['Rekayasa Perangkat Lunak'],
      },
    } as never);
    vi.mocked(tx.schoolClass.create).mockResolvedValue(schoolClass as never);

    await expect(service.createClass({
      name: 'X A',
      gradeLevel: 10,
      academicYearId: 'year-1',
      departmentName: 'Rekayasa Perangkat Lunak',
    }, { id: 'admin-1' })).resolves.toEqual(schoolClass);

    expect(tx.schoolClass.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        name: 'X A',
        gradeLevel: 10,
        departmentName: 'Rekayasa Perangkat Lunak',
      }),
    }));
    expect(tx.auditLog.create).toHaveBeenCalled();
  });

  it('preserves the optional department as null for a class without grouping', async () => {
    const schoolClass = { id: 'class-2', name: 'Kelas 6', departmentName: null };
    vi.mocked(prisma.academicYear.findUnique).mockResolvedValue({
      id: 'year-1',
      name: '2026/2027',
    } as never);
    vi.mocked(tx.schoolClass.create).mockResolvedValue(schoolClass as never);

    await expect(service.createClass({
      name: 'Kelas 6',
      gradeLevel: 6,
      academicYearId: 'year-1',
    }, { id: 'admin-1' })).resolves.toEqual(schoolClass);

    expect(tx.schoolClass.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ departmentName: null }),
    }));
  });
});
