import { getConfig } from '../config';
import { StorageClient } from './types';
import { SupabaseStorageClient } from './supabaseClient';
import { R2StorageClient } from './r2Client';
import { S3StorageClient } from './s3Client';

let cachedClient: StorageClient | null = null;

export const getStorageClient = (): StorageClient => {
  if (cachedClient) return cachedClient;
  const config = getConfig();
  switch (config.STORAGE_PROVIDER) {
    case 'cloudflare_r2':
      cachedClient = new R2StorageClient();
      break;
    case 'aws_s3':
      cachedClient = new S3StorageClient();
      break;
    case 'supabase':
    default:
      cachedClient = new SupabaseStorageClient();
  }
  return cachedClient;
};
