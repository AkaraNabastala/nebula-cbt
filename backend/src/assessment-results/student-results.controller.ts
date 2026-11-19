import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/auth.types.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PermissionGuard } from '../auth/guards/permission.guard.js';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator.js';
import { AssessmentResultsService } from './assessment-results.service.js';

@Controller('student/results')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class StudentResultsController {
  constructor(private readonly results: AssessmentResultsService) {}

  @Get()
  @RequirePermissions('exam_results.read_own')
  list(@Req() request: AuthenticatedRequest) {
    return this.results.studentResults({ id: request.user!.id, roles: request.user!.roles });
  }
}
