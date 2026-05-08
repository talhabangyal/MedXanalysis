import { NextResponse } from 'next/server';
import { registerUser } from '@/lib/auth-api';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const user = await registerUser(body);
    return NextResponse.json({ ok: true, user }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Signup failed';
    return NextResponse.json({ message }, { status: 400 });
  }
}