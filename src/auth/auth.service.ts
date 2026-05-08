import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma';
import { MailerService, resetCodeTemplate } from './mailer.service';
import { randomBytes } from 'crypto';

type AuthUser = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
  role?: 'admin' | 'client' | 'doctor' | 'enterprise' | null;
};

type PublicUser = Omit<AuthUser, 'password'> & { password?: string };

function generateAlphanumericCode(len = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const bytes = randomBytes(len);
  let out = '';
  for (let i = 0; i < len; i++) {
    out += chars[bytes[i] % chars.length];
  }
  return out;
}

function withoutPassword<T extends PublicUser>(user: T) {
  const safeUser = { ...user };
  delete safeUser.password;
  return safeUser;
}

async function findUserByIdentifier(identifier: string) {
  const trimmed = identifier.trim();
  const normalized = trimmed.toLowerCase();

  return prisma.user.findFirst({
    where: {
      OR: [
        { email: { equals: normalized, mode: 'insensitive' } },
        { username: { equals: trimmed, mode: 'insensitive' } },
      ],
    },
  });
}

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private mailer: MailerService,
  ) {}

  async register(
    firstName: string | undefined,
    lastName: string | undefined,
    username: string | undefined,
    email: string,
    password: string,
  ) {
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) throw new ConflictException('Email already exists');
    if (username) {
      const userByUsername = await prisma.user.findUnique({ where: { username } });
      if (userByUsername) throw new ConflictException('Username already exists');
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { firstName, lastName, username, email, password: hashed, role: 'client' },
    });
    return withoutPassword(user);
  }

  // identifier may be email or username
  async validateUser(identifier: string, password: string) {
    const user = await findUserByIdentifier(identifier);
    if (!user) return null;

    const isMatch = await bcrypt.compare(password, user.password!);
    if (!isMatch) return null;

    return withoutPassword(user);
  }

  async login(user: AuthUser) {
    const payload = { sub: user.id, email: user.email, role: user.role ?? 'client' };
    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }

  // Send a 6-character reset code to the user's email (no user enumeration)
  async sendResetCode(identifier: string) {
    const user = await findUserByIdentifier(identifier);
    if (!user) return { ok: true };

    const code = generateAlphanumericCode(6);
    const expiry = new Date(Date.now() + 1000 * 60 * 5); // 5 minutes

    await prisma.forgotPassword.deleteMany({
      where: { userId: user.id },
    });

    await prisma.forgotPassword.create({
      data: {
        userId: user.id,
        code,
        timeLimit: expiry,
        expiredAt: expiry,
      },
    });

    const tpl = resetCodeTemplate(code);
    await this.mailer.sendMail(user.email, tpl.subject, tpl.html, tpl.text);

    return { ok: true };
  }

  async verifyResetCode(identifier: string, code: string) {
    const user = await findUserByIdentifier(identifier);
    if (!user) return { valid: false };

    const resetRecord = await prisma.forgotPassword.findFirst({
      where: { userId: user.id, code: code.trim().toUpperCase() },
      orderBy: { createdAt: 'desc' },
    });

    if (!resetRecord || !resetRecord.timeLimit) return { valid: false };
    if (resetRecord.timeLimit < new Date()) return { valid: false };

    return { valid: true };
  }

  async resetPassword(identifier: string, code: string, newPassword: string) {
    const user = await findUserByIdentifier(identifier);
    if (!user) throw new UnauthorizedException('Invalid or expired code');

    const normalizedCode = code.trim().toUpperCase();
    const resetRecord = await prisma.forgotPassword.findFirst({
      where: {
        userId: user.id,
        code: normalizedCode,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!resetRecord || !resetRecord.timeLimit) throw new UnauthorizedException('Invalid or expired code');
    if (resetRecord.timeLimit < new Date()) throw new UnauthorizedException('Code expired');

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { email: user.email },
      data: { password: hashed },
    });

    await prisma.forgotPassword.deleteMany({
      where: { userId: user.id, code: normalizedCode },
    });

    return { ok: true };
  }
}
