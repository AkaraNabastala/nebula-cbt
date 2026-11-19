import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { PermissionGuard } from './guards/permission.guard.js';
import { AllowPasswordChange } from './decorators/allow-password-change.decorator.js';
import type { AuthenticatedRequest } from './auth.types.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto, @Req() request: AuthenticatedRequest) {
    return this.authService.login(dto, {
      ipAddress: request.ip,
      userAgent: request.get('user-agent'),
    });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @AllowPasswordChange()
  getProfile(@Req() request: AuthenticatedRequest) {
    return request.user;
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @AllowPasswordChange()
  changePassword(
    @Body() dto: ChangePasswordDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.authService.changePassword(request.user!.id, dto, {
      ipAddress: request.ip,
      userAgent: request.get('user-agent'),
    });
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, PermissionGuard)
  logout(@Req() request: AuthenticatedRequest) {
    return this.authService.logout(request.user!.id, {
      ipAddress: request.ip,
      userAgent: request.get('user-agent'),
    });
  }
}
