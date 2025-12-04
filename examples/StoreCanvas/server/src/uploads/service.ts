import { randomUUID } from 'crypto';
import { getRepositoryProvider } from '../repositories';
import { getStorageClient } from '../storage';
import { Upload, UploadType } from '../repositories/types';
import sharp from 'sharp';

export class UploadService {
  private repo = getRepositoryProvider();
  private storage = getStorageClient();

  async get(userId: string, id: string): Promise<Upload | null> {
    const existing = await this.repo.uploads.findById(id);
    if (!existing || existing.userId !== userId) return null;
    return existing;
  }

  async createFromBuffer(
    userId: string,
    projectId: string | undefined,
    type: UploadType,
    buffer: Buffer,
    contentType: string,
    name?: string
  ): Promise<Upload> {
    const meta = await sharp(buffer).metadata();
    const detectedFormat = meta.format ?? this.inferFormatFromMime(contentType);
    const mimeType = this.formatToMime(detectedFormat) || contentType || 'application/octet-stream';
    const uploadResult = await this.storage.uploadImage(buffer, mimeType);
    const upload: Upload = {
      id: randomUUID(),
      userId,
      projectId,
      type,
      name: name?.trim() || 'Asset',
      storageKey: uploadResult.key,
      url: uploadResult.url,
      format: detectedFormat || undefined,
      mimeType,
      width: meta.width,
      height: meta.height,
      createdAt: new Date()
    };
    await this.repo.uploads.create(upload);
    return upload;
  }

  async list(userId: string): Promise<Upload[]> {
    return this.repo.uploads.listByUser(userId);
  }

  async rename(userId: string, id: string, name: string): Promise<Upload | null> {
    const existing = await this.repo.uploads.findById(id);
    if (!existing || existing.userId !== userId) return null;
    const updated = await this.repo.uploads.update(id, { name: name.trim() });
    return updated;
  }

  async delete(userId: string, id: string): Promise<void> {
    const existing = await this.repo.uploads.findById(id);
    if (!existing || existing.userId !== userId) {
      throw new Error('Upload not found');
    }
    await this.storage.deleteObject(existing.storageKey);
    await this.repo.uploads.delete(id);
  }

  private formatToMime(format?: string | null): string | null {
    switch (format) {
      case 'jpeg':
      case 'jpg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'webp':
        return 'image/webp';
      case 'avif':
        return 'image/avif';
      default:
        return null;
    }
  }

  private inferFormatFromMime(mime?: string | null): string | null {
    if (!mime) return null;
    if (mime.includes('jpeg')) return 'jpeg';
    if (mime.includes('png')) return 'png';
    if (mime.includes('webp')) return 'webp';
    if (mime.includes('avif')) return 'avif';
    return null;
  }
}
