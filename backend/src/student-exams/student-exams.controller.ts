import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/auth.types.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PermissionGuard } from '../auth/guards/permission.guard.js';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator.js';
import { StartAttemptDto } from './dto/start-attempt.dto.js';
import { SyncAttemptDto } from './dto/sync-attempt.dto.js';
import { StudentExamsService } from './student-exams.service.js';

@Controller('student')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class StudentExamsController {
  constructor(private readonly studentExams: StudentExamsService) {}

  private actor(request: AuthenticatedRequest) {
    return { id: request.user!.id, ipAddress: request.ip, userAgent: request.get('user-agent') };
  }

  @Get('exams')
  @RequirePermissions('exam_schedules.read')
  listExams(@Req() request: AuthenticatedRequest) {
    return this.studentExams.listExams(this.actor(request));
  }

  @Post('exams/:participantId/start')
  @RequirePermissions('exam_attempts.start')
  start(
    @Param('participantId', new ParseUUIDPipe()) participantId: string,
    @Body() dto: StartAttemptDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.studentExams.start(participantId, dto, this.actor(request));
  }

  @Get('attempts/:id')
  @RequirePermissions('exam_attempts.read_own')
  resume(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Headers('x-attempt-session') sessionToken: string | undefined,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.studentExams.resume(id, sessionToken, this.actor(request));
  }

  @Post('attempts/:id/sync')
  @RequirePermissions('exam_attempts.submit')
  sync(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Headers('x-attempt-session') sessionToken: string | undefined,
    @Body() dto: SyncAttemptDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.studentExams.sync(id, sessionToken, dto, this.actor(request));
  }

  @Post('attempts/:id/submit')
  @RequirePermissions('exam_attempts.submit')
  submit(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Headers('x-attempt-session') sessionToken: string | undefined,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.studentExams.submit(id, sessionToken, this.actor(request));
  }
}
