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

    // Get file extension
    const ext = file.name.split('.').pop() || 'pdf';
    
    // Sanitize filename
    const sanitized = filenameBase
      .toLowerCase()
      .replace(/[^a-z0-9_\-]/g, '_')
      .replace(/\s+/g, '_');
    
    const filename = `${sanitized}.${ext}`;
    const buffer = await file.arrayBuffer();
    
    // Ensure reports directory exists
    const reportsDir = path.join(process.cwd(), 'public', 'report');
    await mkdir(reportsDir, { recursive: true });
    
    // Write file
    const filePath = path.join(reportsDir, filename);
    await writeFile(filePath, Buffer.from(buffer));
    
    return NextResponse.json({
      data: {
        path: `/report/${filename}`,
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
