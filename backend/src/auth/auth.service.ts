import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service.js';
import { LoginDto } from './dto/login.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';

const INVALID_LOGIN = 'Identitas atau password tidak valid.';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(
    dto: LoginDto,
    metadata?: { ipAddress?: string; userAgent?: string },
  ) {
    const identifier = dto.identifier.trim().toLowerCase();
    const identifierType = identifier.includes('@') ? 'EMAIL' : 'USERNAME';

    const identifierRecord = await this.prisma.userIdentifier.findFirst({
      where: { normalizedValue: identifier, identifierType },
      include: {
        user: {
          include: {
            userRoles: {
              include: {
                role: {
                  include: {
                    permissions: { include: { permission: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!identifierRecord) throw new UnauthorizedException(INVALID_LOGIN);

    const user = identifierRecord.user;
    if (user.status !== 'ACTIVE') throw new UnauthorizedException(INVALID_LOGIN);

    const categories = user.userRoles
      .map(({ role }) => role.code)
      .filter((code): code is 'ADMIN' | 'TEACHER' | 'STUDENT' =>
        code === 'ADMIN' || code === 'TEACHER' || code === 'STUDENT',
      );

    if (!categories.length) throw new UnauthorizedException(INVALID_LOGIN);

    const policy = await this.prisma.loginPolicy.findFirst({
      where: {
        category: { in: categories },
        identifierType,
        isEnabled: true,
      },
    });
    if (!policy) throw new UnauthorizedException(INVALID_LOGIN);

    const passwordValid = await argon2
      .verify(user.passwordHash, dto.password)
      .catch(() => false);
    if (!passwordValid) throw new UnauthorizedException(INVALID_LOGIN);

    const roles = [...new Set(user.userRoles.map(({ role }) => role.code))];
    const permissions = [...new Set(
      user.userRoles.flatMap(({ role }) =>
        role.permissions.map(({ permission }) => permission.code),
      ),
    )];

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
      await tx.auditLog.create({
        data: {
          actorUserId: user.id,
          action: 'AUTH_LOGIN',
          entityType: 'USER',
          entityId: user.id,
          description: 'Login berhasil',
          ipAddress: metadata?.ipAddress,
          userAgent: metadata?.userAgent,
        },
      });
    });

    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      tokenVersion: user.tokenVersion,
    });

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: 900,
      user: {
        id: user.id,
        fullName: user.fullName,
        roles,
        permissions,
        mustChangePassword: user.mustChangePassword,
      },
    };
  }

  async logout(
    userId: string,
    metadata?: { ipAddress?: string; userAgent?: string },
  ) {
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { tokenVersion: { increment: 1 } },
      });
      await tx.auditLog.create({
        data: {
          actorUserId: userId,
          action: 'AUTH_LOGOUT',
          entityType: 'USER',
          entityId: userId,
          description: 'Logout; seluruh sesi aktif dicabut',
          ipAddress: metadata?.ipAddress,
          userAgent: metadata?.userAgent,
        },
      });
    });

    return { message: 'Logout berhasil. Seluruh sesi akun telah dicabut.' };
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
    metadata?: { ipAddress?: string; userAgent?: string },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Akun tidak valid.');
    }

    const valid = await argon2.verify(user.passwordHash, dto.currentPassword)
      .catch(() => false);
    if (!valid) {
      throw new BadRequestException('Password saat ini tidak benar.');
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('Password baru harus berbeda.');
    }

    const passwordHash = await argon2.hash(dto.newPassword, {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
    });

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          passwordHash,
          mustChangePassword: false,
          tokenVersion: { increment: 1 },
        },
      });
      await tx.auditLog.create({
        data: {
          actorUserId: userId,
          action: 'AUTH_PASSWORD_CHANGED',
          entityType: 'USER',
          entityId: userId,
          description: 'Password berhasil diganti; seluruh sesi lama dicabut',
          ipAddress: metadata?.ipAddress,
          userAgent: metadata?.userAgent,
        },
      });
    });

    return {
      message: 'Password berhasil diganti. Silakan login kembali.',
      sessionsRevoked: true,
    };
  }
}
