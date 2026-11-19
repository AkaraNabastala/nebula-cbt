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
import { CreateEnrollmentDto } from './dto/create-enrollment.dto.js';
import { CreateTeacherAssignmentDto } from './dto/create-teacher-assignment.dto.js';
import { UpdateAssignmentStatusDto } from './dto/update-assignment-status.dto.js';
import { PeopleManagementService } from './people-management.service.js';

@Controller('people-management')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class PeopleManagementController {
  constructor(private readonly people: PeopleManagementService) {}

  private actor(request: AuthenticatedRequest) {
    return { id: request.user!.id, roles: request.user!.roles, ipAddress: request.ip, userAgent: request.get('user-agent') };
  }

  @Get('options')
  @RequirePermissions('students.read', 'teachers.read', 'classes.read', 'subjects.read')
  options(@Req() request: AuthenticatedRequest) {
    return this.people.options(this.actor(request));
  }

  @Get('enrollments')
  @RequirePermissions('students.read')
  listEnrollments(@Req() request: AuthenticatedRequest) {
    return this.people.listEnrollments(this.actor(request));
  }

  @Post('enrollments')
  @RequirePermissions('students.manage')
  createEnrollment(@Body() dto: CreateEnrollmentDto, @Req() request: AuthenticatedRequest) {
    return this.people.createEnrollment(dto, this.actor(request));
  }

  @Patch('enrollments/:id/leave')
  @RequirePermissions('students.manage')
  leaveEnrollment(@Param('id', new ParseUUIDPipe()) id: string, @Req() request: AuthenticatedRequest) {
    return this.people.leaveEnrollment(id, this.actor(request));
  }

  @Get('teacher-assignments')
  @RequirePermissions('teachers.read')
  listTeacherAssignments(@Req() request: AuthenticatedRequest) {
    return this.people.listTeacherAssignments(this.actor(request));
  }

  @Post('teacher-assignments')
  @RequirePermissions('teacher_assignments.manage')
  createTeacherAssignment(@Body() dto: CreateTeacherAssignmentDto, @Req() request: AuthenticatedRequest) {
    return this.people.createTeacherAssignment(dto, this.actor(request));
  }

  @Patch('teacher-assignments/:id/status')
  @RequirePermissions('teacher_assignments.manage')
  updateTeacherAssignmentStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateAssignmentStatusDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.people.updateTeacherAssignmentStatus(id, dto.isActive, this.actor(request));
  }
}
