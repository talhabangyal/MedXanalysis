import { NextRequest, NextResponse } from 'next/server';
import { saveUpload } from '@/lib/upload-storage';

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

    const result = await saveUpload({
      file,
      folder: 'report',
      filenameBase,
      defaultExtension: '.pdf',
    });
    
    return NextResponse.json({
      data: {
        path: result.path,
      },
    });
  } catch (error) {
    console.error('Report upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload report' },
      { status: 500 }
    );
  }
}
