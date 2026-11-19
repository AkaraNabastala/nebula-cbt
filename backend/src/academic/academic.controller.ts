import {
  Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/auth.types.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PermissionGuard } from '../auth/guards/permission.guard.js';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator.js';
import { AcademicService } from './academic.service.js';
import { CreateAcademicYearDto } from './dto/create-academic-year.dto.js';
import { CreateSubjectDto } from './dto/create-subject.dto.js';
import { CreateClassDto } from './dto/create-class.dto.js';

@Controller('academic')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class AcademicController {
  constructor(private readonly academic: AcademicService) {}

  private actor(request: AuthenticatedRequest) {
    return { id: request.user!.id, ipAddress: request.ip, userAgent: request.get('user-agent') };
  }

  @Get('branding')
  @RequirePermissions('dashboard.read')
  getInstitutionBranding() { return this.academic.getInstitutionBranding(); }

  @Get('education-settings')
  @RequirePermissions('academic_years.read')
  getEducationSettings() { return this.academic.getEducationSettings(); }

  @Patch('education-settings')
  @RequirePermissions('academic_years.manage')
  updateEducationSettings(@Body() body: unknown, @Req() req: AuthenticatedRequest) {
    return this.academic.updateEducationSettings(body, this.actor(req));
  }

  @Get('years')
  @RequirePermissions('academic_years.read')
  listYears() { return this.academic.listYears(); }

  @Post('years')
  @RequirePermissions('academic_years.manage')
  createYear(@Body() dto: CreateAcademicYearDto, @Req() req: AuthenticatedRequest) {
    return this.academic.createYear(dto, this.actor(req));
  }

  @Patch('years/:id/activate')
  @RequirePermissions('academic_years.manage')
  activateYear(@Param('id', new ParseUUIDPipe()) id: string, @Req() req: AuthenticatedRequest) {
    return this.academic.activateYear(id, this.actor(req));
  }

  @Get('subjects')
  @RequirePermissions('subjects.read')
  listSubjects() { return this.academic.listSubjects(); }

  @Post('subjects')
  @RequirePermissions('subjects.manage')
  createSubject(@Body() dto: CreateSubjectDto, @Req() req: AuthenticatedRequest) {
    return this.academic.createSubject(dto, this.actor(req));
  }

  @Get('classes')
  @RequirePermissions('classes.read')
  listClasses(@Query('academicYearId') academicYearId?: string) {
    return this.academic.listClasses(academicYearId);
  }

  @Post('classes')
  @RequirePermissions('classes.manage')
  createClass(@Body() dto: CreateClassDto, @Req() req: AuthenticatedRequest) {
    return this.academic.createClass(dto, this.actor(req));
  }
}
