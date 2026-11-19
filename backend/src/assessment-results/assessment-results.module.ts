import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AssessmentResultsController } from './assessment-results.controller.js';
import { StudentResultsController } from './student-results.controller.js';
import { AssessmentResultsService } from './assessment-results.service.js';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [AssessmentResultsController, StudentResultsController],
  providers: [AssessmentResultsService],
})
export class AssessmentResultsModule {}
