import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { QuestionBanksController } from './question-banks.controller.js';
import { QuestionBanksService } from './question-banks.service.js';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [QuestionBanksController],
  providers: [QuestionBanksService],
})
export class QuestionBanksModule {}
