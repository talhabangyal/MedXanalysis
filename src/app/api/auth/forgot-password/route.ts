import { NextResponse } from 'next/server';
import { requestResetCode } from '@/lib/auth-api';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const identifier = body.email || body.identifier;
    const result = await requestResetCode({ identifier: String(identifier || '') });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to request reset code';
    return NextResponse.json({ message }, { status: 400 });
  }
}