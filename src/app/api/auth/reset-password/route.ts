import { NextResponse } from 'next/server';
import { resetUserPassword } from '@/lib/auth-api';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await resetUserPassword({
      email: body.email || body.identifier,
      code: body.code,
      password: body.password,
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to reset password';
    return NextResponse.json({ message }, { status: 400 });
  }
}