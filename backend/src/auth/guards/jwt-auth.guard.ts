import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AuthenticatedRequest } from '../auth.types.js';
import { ALLOW_PASSWORD_CHANGE } from '../decorators/allow-password-change.decorator.js';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.get('authorization');
    const [scheme, token, extra] = authorization?.split(' ') ?? [];

    if (scheme !== 'Bearer' || !token || extra) {
      throw new UnauthorizedException('Token tidak tersedia atau format salah.');
    }

    let payload: { sub: string; tokenVersion: number };
    try {
      payload = await this.jwt.verifyAsync(token);
    } catch {
      throw new UnauthorizedException('Token tidak valid atau kedaluwarsa.');
    }

    if (
      !payload.sub ||
      !Number.isInteger(payload.tokenVersion) ||
      payload.tokenVersion < 0
    ) {
      throw new UnauthorizedException('Token tidak valid atau kedaluwarsa.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
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
    });

    if (
      !user ||
      user.status !== 'ACTIVE' ||
      user.tokenVersion !== payload.tokenVersion
    ) {
      throw new UnauthorizedException('Sesi telah dicabut atau tidak valid.');
    }

    const allowPasswordChange = this.reflector.getAllAndOverride<boolean>(
      ALLOW_PASSWORD_CHANGE,
      [context.getHandler(), context.getClass()],
    );

    if (user.mustChangePassword && !allowPasswordChange) {
      throw new ForbiddenException(
        'Anda wajib mengganti password sebelum menggunakan layanan.',
      );
    }

    request.user = {
      id: user.id,
      fullName: user.fullName,
      roles: user.userRoles.map(({ role }) => role.code),
      permissions: [...new Set(
        user.userRoles.flatMap(({ role }) =>
          role.permissions.map(({ permission }) => permission.code),
        ),
      )],
      mustChangePassword: user.mustChangePassword,
    };

    return true;
  }
}
