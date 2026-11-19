import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { PermissionGuard } from './guards/permission.guard.js';

@Module({
  imports: [
    PrismaModule,
    JwtModule.registerAsync({
      useFactory: () => {
        const secret = process.env.JWT_ACCESS_SECRET;

        if (!secret || secret.length < 32) {
          throw new Error(
            'JWT_ACCESS_SECRET wajib tersedia dan minimal 32 karakter.',
          );
        }

        return {
          secret,
          signOptions: {
            expiresIn: '15m',
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, PermissionGuard],
  exports: [AuthService, JwtAuthGuard, PermissionGuard, JwtModule],
})
export class AuthModule {}
