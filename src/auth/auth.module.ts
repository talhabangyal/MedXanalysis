import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { MailerService } from './mailer.service';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { LocalStrategy } from './local.strategy';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'SUPER_SECRET',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  providers: [AuthService, MailerService, LocalStrategy, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}

