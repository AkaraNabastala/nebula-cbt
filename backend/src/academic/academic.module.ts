import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { AcademicController } from './academic.controller.js';
import { AcademicService } from './academic.service.js';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [AcademicController],
  providers: [AcademicService],
})
export class AcademicModule {}
