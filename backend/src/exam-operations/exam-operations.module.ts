import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ExamOperationsController } from './exam-operations.controller.js';
import { ExamOperationsService } from './exam-operations.service.js';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ExamOperationsController],
  providers: [ExamOperationsService],
})
export class ExamOperationsModule {}
