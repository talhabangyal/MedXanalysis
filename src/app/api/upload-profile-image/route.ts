import { NextResponse } from 'next/server';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

function sanitizeBaseName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const filenameBase = String(formData.get('filenameBase') || '').trim();

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'file is required' }, { status: 400 });
    }

    if (!filenameBase) {
      return NextResponse.json({ error: 'filenameBase is required' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const extension = path.extname(file.name) || '.png';
    const safeName = sanitizeBaseName(filenameBase) || 'profile_image';
    const outputName = `${safeName}${extension}`;
    const publicDir = path.join(process.cwd(), 'public', 'profile');
    const outputPath = path.join(publicDir, outputName);

    await mkdir(publicDir, { recursive: true });
    await writeFile(outputPath, buffer);

    return NextResponse.json({ data: { path: `/profile/${outputName}` } }, { status: 200 });
  } catch (error) {
    console.error('Failed to upload profile image:', error);
    return NextResponse.json({ error: 'Failed to upload profile image' }, { status: 500 });
  }
}