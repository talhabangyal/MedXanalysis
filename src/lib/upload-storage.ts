import { createClient } from '@supabase/supabase-js';
import { del, put } from '@vercel/blob';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  getSupabaseServiceKey,
  getSupabaseStorageBucket,
  getSupabaseUrl,
} from './env';

type SaveUploadInput = {
  file: File;
  folder: string;
  filenameBase: string;
  defaultExtension: string;
};

type SaveUploadResult = {
  path: string;
};

function sanitizePathPart(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

function getExtension(file: File, fallback: string) {
  const originalName = file.name || '';
  const ext = path.extname(originalName);
  return ext || fallback;
}

function buildObjectName(input: SaveUploadInput) {
  const folder = sanitizePathPart(input.folder) || 'uploads';
  const base = sanitizePathPart(input.filenameBase) || 'upload';
  const extension = getExtension(input.file, input.defaultExtension);
  const safeExtension = extension.startsWith('.') ? extension : `.${extension}`;
  return `${folder}/${base}-${Date.now()}${safeExtension.toLowerCase()}`;
}

function isRemoteUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

function hasSupabaseStorageConfig() {
  return Boolean(getSupabaseUrl() && getSupabaseServiceKey());
}

function getSupabaseStorageClient() {
  const supabaseUrl = getSupabaseUrl();
  const serviceKey = getSupabaseServiceKey();

  if (!supabaseUrl || !serviceKey) {
    throw new Error('Supabase storage requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }

  return createClient(supabaseUrl, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function ensureSupabaseBucket(
  supabase: ReturnType<typeof getSupabaseStorageClient>,
  bucket: string
) {
  const { error: getBucketError } = await supabase.storage.getBucket(bucket);
  if (!getBucketError) return;

  const { error: createBucketError } = await supabase.storage.createBucket(bucket, {
    public: true,
  });

  if (createBucketError && !/already exists/i.test(createBucketError.message)) {
    throw new Error(`Failed to create Supabase Storage bucket: ${createBucketError.message}`);
  }
}

function parseSupabasePublicPath(uploadPath: string) {
  const supabaseUrl = getSupabaseUrl();
  if (!supabaseUrl || !isRemoteUrl(uploadPath)) return null;

  try {
    const storageUrl = new URL(uploadPath);
    const configuredUrl = new URL(supabaseUrl);

    if (storageUrl.hostname !== configuredUrl.hostname) return null;

    const marker = '/storage/v1/object/public/';
    const markerIndex = storageUrl.pathname.indexOf(marker);
    if (markerIndex === -1) return null;

    const storagePath = decodeURIComponent(storageUrl.pathname.slice(markerIndex + marker.length));
    const [bucket, ...objectPathParts] = storagePath.split('/');
    const objectPath = objectPathParts.join('/');

    if (!bucket || !objectPath) return null;

    return { bucket, objectPath };
  } catch {
    return null;
  }
}

export async function saveUpload(input: SaveUploadInput): Promise<SaveUploadResult> {
  const objectName = buildObjectName(input);
  const bytes = Buffer.from(await input.file.arrayBuffer());

  if (hasSupabaseStorageConfig()) {
    const supabase = getSupabaseStorageClient();
    const bucket = getSupabaseStorageBucket();
    await ensureSupabaseBucket(supabase, bucket);

    const { error } = await supabase.storage.from(bucket).upload(objectName, bytes, {
      contentType: input.file.type || undefined,
      upsert: false,
    });

    if (error) {
      throw new Error(`Failed to upload file to Supabase Storage: ${error.message}`);
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(objectName);
    return { path: data.publicUrl };
  }

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(objectName, bytes, {
      access: 'public',
      contentType: input.file.type || undefined,
    });

    return { path: blob.url };
  }

  if (process.env.VERCEL === '1') {
    throw new Error(
      'Uploads on Vercel require Supabase Storage env vars or BLOB_READ_WRITE_TOKEN.'
    );
  }

  const localPath = path.join(process.cwd(), 'public', objectName);
  await fs.mkdir(path.dirname(localPath), { recursive: true });
  await fs.writeFile(localPath, bytes);

  return { path: `/${objectName}` };
}

export async function deleteUpload(uploadPath: string | null | undefined) {
  if (!uploadPath) return;

  try {
    const supabasePath = parseSupabasePublicPath(uploadPath);
    if (supabasePath && hasSupabaseStorageConfig()) {
      const supabase = getSupabaseStorageClient();
      await supabase.storage.from(supabasePath.bucket).remove([supabasePath.objectPath]);
      return;
    }

    if (isRemoteUrl(uploadPath)) {
      await del(uploadPath);
      return;
    }

    const relativePath = uploadPath.replace(/^\/+/, '');
    const localPath = path.join(process.cwd(), 'public', relativePath);
    await fs.unlink(localPath);
  } catch (error) {
    console.warn('Failed to delete upload:', error);
  }
}
