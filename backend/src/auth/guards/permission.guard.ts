import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRED_PERMISSIONS } from '../decorators/require-permissions.decorator.js';
import { AuthenticatedRequest } from '../auth.types.js';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(
      REQUIRED_PERMISSIONS,
      [context.getHandler(), context.getClass()],
    );

    if (!required?.length) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<AuthenticatedRequest>();

    const permissions = request.user?.permissions ?? [];
    const allowed = required.every((permission) =>
      permissions.includes(permission),
    );

    if (!allowed) {
      throw new ForbiddenException('Permission tidak mencukupi.');
    }

    return true;
  }
}
