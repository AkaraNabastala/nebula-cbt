import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/auth.types.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PermissionGuard } from '../auth/guards/permission.guard.js';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator.js';
import { CreateExamDto } from './dto/create-exam.dto.js';
import { ExamOperationsService } from './exam-operations.service.js';

@Controller('exam-operations')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class ExamOperationsController {
  constructor(private readonly exams: ExamOperationsService) {}

  private actor(request: AuthenticatedRequest) {
    return {
      id: request.user!.id,
      roles: request.user!.roles,
      ipAddress: request.ip,
      userAgent: request.get('user-agent'),
    };
  }

  @Get('options')
  @RequirePermissions('exams.read')
  options(@Req() request: AuthenticatedRequest) {
    return this.exams.options(this.actor(request));
  }

  @Get()
  @RequirePermissions('exams.read')
  list(@Req() request: AuthenticatedRequest) {
    return this.exams.list(this.actor(request));
  }

  @Post()
  @RequirePermissions('exams.manage', 'exam_papers.manage', 'exam_schedules.manage')
  create(@Body() dto: CreateExamDto, @Req() request: AuthenticatedRequest) {
    return this.exams.create(dto, this.actor(request));
  }

  @Patch(':id/publish')
  @RequirePermissions('exams.manage', 'exam_papers.manage', 'exam_schedules.manage', 'exam_participants.manage')
  publish(@Param('id', new ParseUUIDPipe()) id: string, @Req() request: AuthenticatedRequest) {
    return this.exams.publish(id, this.actor(request));
  }
}
