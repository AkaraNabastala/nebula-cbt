import {
  Body,
  Controller,
  Get,
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
import { CreateQuestionBankDto } from './dto/create-question-bank.dto.js';
import { CreateQuestionDto } from './dto/create-question.dto.js';
import { QuestionBanksService } from './question-banks.service.js';

@Controller('question-banks')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class QuestionBanksController {
  constructor(private readonly questionBanks: QuestionBanksService) {}

  private actor(request: AuthenticatedRequest) {
    return {
      id: request.user!.id,
      roles: request.user!.roles,
      ipAddress: request.ip,
      userAgent: request.get('user-agent'),
    };
  }

  @Get('subjects')
  @RequirePermissions('subjects.read')
  listSubjects(@Req() request: AuthenticatedRequest) {
    return this.questionBanks.listSubjects(this.actor(request));
  }

  @Get()
  @RequirePermissions('question_banks.read')
  listBanks(@Req() request: AuthenticatedRequest) {
    return this.questionBanks.listBanks(this.actor(request));
  }

  @Post()
  @RequirePermissions('question_banks.manage')
  createBank(@Body() dto: CreateQuestionBankDto, @Req() request: AuthenticatedRequest) {
    return this.questionBanks.createBank(dto, this.actor(request));
  }

  @Get(':id/questions')
  @RequirePermissions('questions.read')
  listQuestions(@Param('id', new ParseUUIDPipe()) id: string, @Req() request: AuthenticatedRequest) {
    return this.questionBanks.listQuestions(id, this.actor(request));
  }

  @Post(':id/questions')
  @RequirePermissions('questions.manage')
  createQuestion(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CreateQuestionDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.questionBanks.createQuestion(id, dto, this.actor(request));
  }
}
