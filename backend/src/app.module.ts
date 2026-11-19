import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { AcademicModule } from './academic/academic.module.js';
import { QuestionBanksModule } from './question-banks/question-banks.module.js';
import { ExamOperationsModule } from './exam-operations/exam-operations.module.js';

@Module({
  imports: [PrismaModule, AuthModule, UsersModule, AcademicModule, QuestionBanksModule, ExamOperationsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}