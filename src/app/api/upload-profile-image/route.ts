import { NextResponse } from 'next/server';
import { saveUpload } from '@/lib/upload-storage';

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

    const result = await saveUpload({
      file,
      folder: 'profile',
      filenameBase,
      defaultExtension: '.png',
    });

    return NextResponse.json({ data: { path: result.path } }, { status: 200 });
  } catch (error) {
    console.error('Failed to upload profile image:', error);
    return NextResponse.json({ error: 'Failed to upload profile image' }, { status: 500 });
  }
}