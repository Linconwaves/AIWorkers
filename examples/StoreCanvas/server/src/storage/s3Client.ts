import { StorageClient, StorageUploadResult } from './types';
import { randomUUID } from 'crypto';
import { getConfig } from '../config';

export class S3StorageClient implements StorageClient {
  private bucket: string;
  private publicBase?: string;

  constructor() {
    const config = getConfig();
    this.bucket = config.AWS_S3_BUCKET ?? 'storecanvas';
    this.publicBase = config.AWS_S3_PUBLIC_BASE_URL;
  }

  async uploadImage(buffer: Buffer, contentType: string): Promise<StorageUploadResult> {
    const key = `${this.bucket}/images/${randomUUID()}`;
    return { key, url: this.buildUrl(key) };
  }

  async uploadExport(buffer: Buffer, contentType: string): Promise<StorageUploadResult> {
    const key = `${this.bucket}/exports/${randomUUID()}`;
    return { key, url: this.buildUrl(key) };
  }

  async deleteObject(_key: string): Promise<void> {
    // TODO: implement AWS S3 deletion.
  }

  private buildUrl(key: string) {
    return this.publicBase ? `${this.publicBase}/${key.replace(`${this.bucket}/`, '')}` : key;
  }
}
