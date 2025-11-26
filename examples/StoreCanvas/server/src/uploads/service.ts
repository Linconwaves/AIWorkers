import { randomUUID } from 'crypto';
import { getRepositoryProvider } from '../repositories';
import { getStorageClient } from '../storage';
import { Upload, UploadType } from '../repositories/types';

export class UploadService {
  private repo = getRepositoryProvider();
  private storage = getStorageClient();

  async createFromBuffer(
    userId: string,
    projectId: string | undefined,
    type: UploadType,
    buffer: Buffer,
    contentType: string
  ): Promise<Upload> {
    const uploadResult = await this.storage.uploadImage(buffer, contentType);
    const upload: Upload = {
      id: randomUUID(),
      userId,
      projectId,
      type,
      storageKey: uploadResult.key,
      url: uploadResult.url,
      createdAt: new Date()
    };
    await this.repo.uploads.create(upload);
    return upload;
  }

  async list(userId: string): Promise<Upload[]> {
    return this.repo.uploads.listByUser(userId);
  }

  async delete(userId: string, id: string): Promise<void> {
    const existing = await this.repo.uploads.findById(id);
    if (!existing || existing.userId !== userId) {
      throw new Error('Upload not found');
    }
    await this.storage.deleteObject(existing.storageKey);
    await this.repo.uploads.delete(id);
  }
}
