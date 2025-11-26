import { StorageClient, StorageUploadResult } from './types';
import { getConfig } from '../config';
import { randomUUID } from 'crypto';

export class SupabaseStorageClient implements StorageClient {
  private bucket: string;
  private baseUrl: string;

  constructor() {
    const config = getConfig();
    this.bucket = config.SUPABASE_STORAGE_BUCKET ?? 'storecanvas-assets';
    this.baseUrl = config.SUPABASE_STORAGE_URL_BASE ?? '';
  }

  async uploadImage(buffer: Buffer, contentType: string): Promise<StorageUploadResult> {
    const key = `${this.bucket}/images/${randomUUID()}`;
    // TODO: integrate with Supabase client; this is a placeholder URL.
    return { key, url: this.buildUrl(key) };
  }

  async uploadExport(buffer: Buffer, contentType: string): Promise<StorageUploadResult> {
    const key = `${this.bucket}/exports/${randomUUID()}`;
    return { key, url: this.buildUrl(key) };
  }

  async deleteObject(_key: string): Promise<void> {
    // TODO: implement deletion using Supabase storage API.
  }

  private buildUrl(key: string) {
    return this.baseUrl ? `${this.baseUrl}/${key.replace(`${this.bucket}/`, '')}` : key;
  }
}
