import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { StudentExamsController } from './student-exams.controller.js';
import { StudentExamsService } from './student-exams.service.js';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [StudentExamsController],
  providers: [StudentExamsService],
})
export class StudentExamsModule {}
