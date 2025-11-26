import { StorageClient, StorageUploadResult } from './types';
import { randomUUID } from 'crypto';
import { getConfig } from '../config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

export class R2StorageClient implements StorageClient {
  private bucket: string;
  private publicBase?: string;
  private client: S3Client;

  constructor() {
    const config = getConfig();
    this.bucket = config.R2_BUCKET ?? 'storecanvas';
    this.publicBase = config.R2_PUBLIC_BASE_URL;
    const endpoint = `https://${config.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

    this.client = new S3Client({
      region: 'auto',
      endpoint,
      credentials: {
        accessKeyId: config.R2_ACCESS_KEY_ID ?? '',
        secretAccessKey: config.R2_SECRET_ACCESS_KEY ?? ''
      }
    });
  }

  async uploadImage(buffer: Buffer, contentType: string): Promise<StorageUploadResult> {
    const key = `images/${randomUUID()}`;
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType
      })
    );
    return { key, url: this.buildUrl(key) };
  }

  async uploadExport(buffer: Buffer, contentType: string): Promise<StorageUploadResult> {
    const key = `exports/${randomUUID()}`;
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType
      })
    );
    return { key, url: this.buildUrl(key) };
  }

  async deleteObject(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key
      })
    );
  }

  private buildUrl(key: string) {
    return this.publicBase ? `${this.publicBase}/${key}` : key;
  }
}
