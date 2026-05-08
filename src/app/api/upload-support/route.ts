import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const filenameBase = formData.get('filenameBase') as string;

    if (!file || !filenameBase) {
      return NextResponse.json(
        { error: 'File and filenameBase are required' },
        { status: 400 }
      );
    }

    const ext = file.name.split('.').pop() || 'png';

    const sanitized = filenameBase
      .toLowerCase()
      .replace(/[^a-z0-9_\-]/g, '_')
      .replace(/\s+/g, '_');

    const filename = `${sanitized}.${ext}`;
    const buffer = await file.arrayBuffer();

    const supportDir = path.join(process.cwd(), 'public', 'support');
    await mkdir(supportDir, { recursive: true });

    const filePath = path.join(supportDir, filename);
    await writeFile(filePath, Buffer.from(buffer));

    return NextResponse.json({
      data: {
        path: `/support/${filename}`,
      },
    });
  } catch (error) {
    console.error('Support upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload support file' },
      { status: 500 }
    );
  }
}
