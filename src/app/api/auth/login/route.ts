import { NextResponse } from 'next/server';
import { loginUser } from '@/lib/auth-api';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await loginUser(body);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed';
    console.error('Login error:', error);
    return NextResponse.json({ message }, { status: 401 });
  }
}