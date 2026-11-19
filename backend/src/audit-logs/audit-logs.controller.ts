import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/auth.types.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PermissionGuard } from '../auth/guards/permission.guard.js';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator.js';
import { ListAuditLogsDto } from './dto/list-audit-logs.dto.js';
import { AuditLogsService } from './audit-logs.service.js';

@Controller('audit-logs')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class AuditLogsController {
  constructor(private readonly auditLogs: AuditLogsService) {}

  @Get()
  @RequirePermissions('audit_logs.read')
  list(@Query() query: ListAuditLogsDto, @Req() request: AuthenticatedRequest) {
    return this.auditLogs.list(query, { roles: request.user!.roles });
  }
}
