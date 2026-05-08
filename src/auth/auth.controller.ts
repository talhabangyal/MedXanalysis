import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './local-auth.guard';
import { JwtAuthGuard } from './jwt-auth.guard';

type AuthBody = {
  firstName?: string;
  lastName?: string;
  username?: string;
  email: string;
  password: string;
  code: string;
};

type AuthenticatedRequest = {
  user: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    username?: string | null;
    role?: 'admin' | 'client' | 'doctor' | 'enterprise' | null;
  };
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // REGISTER
  @Post('register')
  register(@Body() body: AuthBody) {
    return this.authService.register(
      body.firstName,
      body.lastName,
      body.username,
      body.email,
      body.password,
    );
  }

  // LOGIN (uses LocalStrategy)
  @UseGuards(LocalAuthGuard)
  @Post('login')
  login(@Request() req: AuthenticatedRequest) {
    return this.authService.login(req.user);
  }

  // PROTECTED ROUTE
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req: AuthenticatedRequest) {
    return req.user;
  }

  // FORGOT PASSWORD - sends reset code
  @Post('forgot-password')
  async forgotPassword(@Body() body: AuthBody) {
    return this.authService.sendResetCode(body.email || body.username || '');
  }

  @Post('verify-reset-code')
  async verifyResetCode(@Body() body: AuthBody) {
    return this.authService.verifyResetCode(body.email || body.username || '', body.code);
  }

  // RESET PASSWORD - verify code and set new password
  @Post('reset-password')
  async resetPassword(@Body() body: AuthBody) {
    return this.authService.resetPassword(body.email || body.username || '', body.code, body.password);
  }
}
