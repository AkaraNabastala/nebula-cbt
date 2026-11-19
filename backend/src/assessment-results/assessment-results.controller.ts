import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/auth.types.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PermissionGuard } from '../auth/guards/permission.guard.js';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator.js';
import { GradeEssayDto } from './dto/grade-essay.dto.js';
import { AssessmentResultsService } from './assessment-results.service.js';

@Controller('assessment-results')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class AssessmentResultsController {
  constructor(private readonly results: AssessmentResultsService) {}

  private actor(request: AuthenticatedRequest) {
    return { id: request.user!.id, roles: request.user!.roles, ipAddress: request.ip, userAgent: request.get('user-agent') };
  }

  @Get()
  @RequirePermissions('exam_results.read')
  list(@Req() request: AuthenticatedRequest) {
    return this.results.list(this.actor(request));
  }

  @Get(':id')
  @RequirePermissions('exam_results.read')
  detail(@Param('id', new ParseUUIDPipe()) id: string, @Req() request: AuthenticatedRequest) {
    return this.results.detail(id, this.actor(request));
  }

  @Patch(':id/essays/:answerId')
  @RequirePermissions('exam_results.manage')
  gradeEssay(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('answerId', new ParseUUIDPipe()) answerId: string,
    @Body() dto: GradeEssayDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.results.gradeEssay(id, answerId, dto, this.actor(request));
  }

  @Patch(':id/publish')
  @RequirePermissions('exam_results.manage')
  publish(@Param('id', new ParseUUIDPipe()) id: string, @Req() request: AuthenticatedRequest) {
    return this.results.publish(id, this.actor(request));
  }
}
