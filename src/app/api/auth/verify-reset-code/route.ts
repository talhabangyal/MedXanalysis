import { NextResponse } from 'next/server';
import { verifyResetCode } from '@/lib/auth-api';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await verifyResetCode({
      email: String(body.email || body.identifier || ''),
      code: String(body.code || ''),
    });

    if (!result.valid) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to verify reset code';
    return NextResponse.json({ message }, { status: 400 });
  }
}
