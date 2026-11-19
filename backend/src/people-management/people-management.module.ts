import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { PeopleManagementController } from './people-management.controller.js';
import { PeopleManagementService } from './people-management.service.js';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [PeopleManagementController],
  providers: [PeopleManagementService],
})
export class PeopleManagementModule {}
