export function getDatabaseUrl() {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    ''
  );
}

export function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
}

export function getSupabaseServiceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || '';
}

export function getSupabaseStorageBucket() {
  return process.env.SUPABASE_STORAGE_BUCKET || 'uploads';
}
