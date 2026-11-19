import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { ListUsersQueryDto } from './dto/list-users-query.dto.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListUsersQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const search = query.search?.trim();
    const where = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.role ? {
        userRoles: { some: { role: { code: query.role } } },
      } : {}),
      ...(search ? {
        OR: [
          { fullName: { contains: search, mode: 'insensitive' as const } },
          {
            identifiers: {
              some: {
                identifierValue: { contains: search, mode: 'insensitive' as const },
              },
            },
          },
        ],
      } : {}),
    };

    const [total, users] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { fullName: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          fullName: true,
          status: true,
          mustChangePassword: true,
          lastLoginAt: true,
          createdAt: true,
          identifiers: {
            select: {
              identifierType: true,
              identifierValue: true,
              isPrimary: true,
            },
            orderBy: { isPrimary: 'desc' },
          },
          userRoles: {
            select: { role: { select: { code: true, name: true } } },
          },
        },
      }),
    ]);

    return {
      data: users.map((user) => ({
        ...user,
        roles: user.userRoles.map(({ role }) => role),
        userRoles: undefined,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async create(
    dto: CreateUserDto,
    actor: { id: string; ipAddress?: string; userAgent?: string },
  ) {
    const identifier = dto.identifier.trim();
    const normalizedValue = identifier.toLowerCase();

    if (dto.identifierType === 'EMAIL' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) {
      throw new ConflictException('Format email tidak valid.');
    }

    if (dto.identifierType === 'USERNAME' && !/^[a-zA-Z0-9._-]+$/.test(identifier)) {
      throw new ConflictException('Username hanya boleh berisi huruf, angka, titik, garis bawah, dan tanda hubung.');
    }

    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
    });

    try {
      return await this.prisma.$transaction(async (tx) => {
        const role = await tx.role.findUnique({
          where: { code: dto.roleCode },
          select: { id: true, code: true, name: true },
        });
        if (!role) throw new NotFoundException('Role tidak ditemukan.');

        const existing = await tx.userIdentifier.findUnique({
          where: { normalizedValue },
          select: { id: true },
        });
        if (existing) throw new ConflictException('Identitas login sudah digunakan.');

        const user = await tx.user.create({
          data: {
            fullName: dto.fullName.trim(),
            passwordHash,
            mustChangePassword: true,
            identifiers: {
              create: {
                identifierType: dto.identifierType,
                identifierValue: identifier,
                normalizedValue,
                isPrimary: true,
              },
            },
            userRoles: { create: { roleId: role.id } },
            ...(dto.roleCode === 'STUDENT' ? { studentProfile: { create: {} } } : {}),
            ...(dto.roleCode === 'TEACHER' ? { teacherProfile: { create: {} } } : {}),
          },
          select: {
            id: true,
            fullName: true,
            status: true,
            mustChangePassword: true,
            createdAt: true,
            identifiers: {
              select: { identifierType: true, identifierValue: true, isPrimary: true },
            },
            userRoles: {
              select: { role: { select: { code: true, name: true } } },
            },
          },
        });

        await tx.auditLog.create({
          data: {
            actorUserId: actor.id,
            action: 'USER_CREATED',
            entityType: 'USER',
            entityId: user.id,
            description: `Akun ${dto.roleCode} dibuat oleh administrator.`,
            ipAddress: actor.ipAddress,
            userAgent: actor.userAgent,
          },
        });

        return {
          ...user,
          roles: user.userRoles.map(({ role: assignedRole }) => assignedRole),
          userRoles: undefined,
        };
      });
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Identitas login sudah digunakan.');
      }
      throw error;
    }
  }

  async updateStatus(
    userId: string,
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED',
    actor: { id: string; ipAddress?: string; userAgent?: string },
  ) {
    if (userId === actor.id && status !== 'ACTIVE') {
      throw new ConflictException('Anda tidak dapat menonaktifkan akun sendiri.');
    }

    return this.prisma.$transaction(async (tx) => {
      const current = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, fullName: true, status: true },
      });
      if (!current) throw new NotFoundException('Pengguna tidak ditemukan.');
      if (current.status === status) return current;

      const updated = await tx.user.update({
        where: { id: userId },
        data: {
          status,
          tokenVersion: status === 'ACTIVE' ? undefined : { increment: 1 },
        },
        select: { id: true, fullName: true, status: true },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: actor.id,
          action: 'USER_STATUS_CHANGED',
          entityType: 'USER',
          entityId: userId,
          description: `Status akun diubah dari ${current.status} menjadi ${status}.`,
          ipAddress: actor.ipAddress,
          userAgent: actor.userAgent,
          oldData: { status: current.status },
          newData: { status },
        },
      });

      return updated;
    });
  }
}
