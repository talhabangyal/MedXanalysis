import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import nodemailer from 'nodemailer';
import { prisma } from './prisma';

type Role = 'admin' | 'client' | 'doctor' | 'enterprise';

type UserShape = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  email: string;
  role: Role;
};

function toPublicUser(user: {
  id: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  email: string;
  role: Role;
}) {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    email: user.email,
    role: user.role,
  } satisfies UserShape;
}

function generateCode(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const bytes = randomBytes(length);
  return Array.from({ length }, (_, index) => chars[bytes[index] % chars.length]).join('');
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

// Use Nest's JwtService for token creation to keep tokens consistent
const jwtService = new JwtService({
  secret: process.env.JWT_SECRET || 'dev-secret',
  signOptions: { expiresIn: '1d' },
});

function mailTransport() {
  const port = Number(process.env.BREVO_SMTP_PORT || 587);
  return nodemailer.createTransport({
    host: process.env.BREVO_SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.BREVO_SMTP_USER,
      pass: process.env.BREVO_SMTP_PASS,
    },
  });
}

function resetEmailTemplate(code: string) {
  return {
    subject: 'Your MedXAnalysis password reset code',
    html: `<div style="font-family:Arial,sans-serif;line-height:1.5;color:#0f172a"><h2>MedXAnalysis</h2><p>Use this code to reset your password. It expires in 5 minutes.</p><div style="display:inline-block;margin:16px 0;padding:12px 18px;border-radius:10px;background:#eff6ff;font-size:22px;font-weight:700;letter-spacing:3px">${code}</div><p>If you did not request this, you can ignore this email.</p></div>`,
    text: `MedXAnalysis reset code: ${code}. This code expires in 5 minutes.`,
  };
}

export async function registerUser(input: {
  firstName?: string;
  lastName?: string;
  username?: string;
  email: string;
  password: string;
}) {
  const email = input.email.trim().toLowerCase();
  const username = input.username?.trim() || null;

  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) {
    throw new Error('Email already exists');
  }

  if (username) {
    const existingUsername = await prisma.user.findUnique({ where: { username } });
    if (existingUsername) {
      throw new Error('Username already exists');
    }
  }

  const hashedPassword = await bcrypt.hash(input.password, 10);
  const user = await prisma.user.create({
    data: {
      firstName: input.firstName?.trim() || null,
      lastName: input.lastName?.trim() || null,
      username,
      email,
      password: hashedPassword,
      role: 'client',
    },
  });

  return toPublicUser(user);
}

export async function loginUser(input: { identifier: string; password: string }) {
  const user = await findUserByIdentifier(input.identifier);

  if (!user) {
    throw new Error('Invalid credentials');
  }

  const passwordMatches = await bcrypt.compare(input.password, user.password);
  if (!passwordMatches) {
    throw new Error('Invalid credentials');
  }

  const userPayload = toPublicUser(user);

  return {
    access_token: jwtService.sign({ sub: user.id, email: user.email, role: user.role }),
    user: userPayload,
  };
}

export async function requestResetCode(input: { identifier: string }) {
  const user = await findUserByIdentifier(input.identifier);

  if (!user) {
    return { ok: true };
  }

  const code = generateCode(6);
  const expiry = new Date(Date.now() + 5 * 60 * 1000);

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

  const transporter = mailTransport();
  const template = resetEmailTemplate(code);

  if (process.env.BREVO_SMTP_HOST && process.env.BREVO_SMTP_USER && process.env.BREVO_SMTP_PASS) {
    await transporter.sendMail({
      from: process.env.BREVO_FROM_EMAIL || process.env.BREVO_SMTP_USER,
      to: user.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  return { ok: true };
}

export async function verifyResetCode(input: { email: string; code: string }) {
  const identifier = input.email.trim();
  const code = input.code.trim().toUpperCase();
  const user = await findUserByIdentifier(identifier);

  if (!user) {
    return { valid: false, message: 'Invalid code' };
  }

  const resetRecord = await prisma.forgotPassword.findFirst({
    where: { userId: user.id, code },
    orderBy: { createdAt: 'desc' },
  });

  if (!resetRecord || !resetRecord.timeLimit) {
    return { valid: false, message: 'Invalid code' };
  }

  if (resetRecord.timeLimit < new Date()) {
    return { valid: false, message: 'Code expired' };
  }

  return { valid: true };
}

export async function resetUserPassword(input: { email: string; code: string; password: string }) {
  const identifier = input.email.trim();
  const user = await findUserByIdentifier(identifier);

  if (!user) {
    throw new Error('Invalid or expired code');
  }

  const normalizedCode = input.code.trim().toUpperCase();
  const resetRecord = await prisma.forgotPassword.findFirst({
    where: { userId: user.id, code: normalizedCode },
    orderBy: { createdAt: 'desc' },
  });

  if (!resetRecord || !resetRecord.timeLimit || resetRecord.timeLimit < new Date()) {
    throw new Error('Invalid or expired code');
  }

  const hashedPassword = await bcrypt.hash(input.password, 10);
  await prisma.user.update({
    where: { email: user.email },
    data: { password: hashedPassword },
  });

  await prisma.forgotPassword.deleteMany({ where: { userId: user.id, code: input.code.trim().toUpperCase() } });

  return { ok: true };
}