// auth/local.strategy.ts
import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    // accept an "identifier" field which can be username or email
    super({ usernameField: 'identifier' });
  }

  async validate(identifier: string, password: string) {
    const user = await this.authService.validateUser(identifier, password);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    return user;
  }
}
