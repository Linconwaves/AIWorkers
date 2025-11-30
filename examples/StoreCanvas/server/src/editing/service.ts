import fetch from 'node-fetch';
import sharp from 'sharp';
import { getRepositoryProvider } from '../repositories';
import { getStorageClient } from '../storage';
import { Upload } from '../repositories/types';
import { randomUUID } from 'crypto';

export type TransformMode = 'upscale' | 'downscale' | 'resize';
export type FilterAction = 'blur' | 'brightness' | 'remove_background';

export interface TransformRequest {
  userId: string;
  uploadId: string;
  mode: TransformMode;
  scaleFactor?: number;
  width?: number;
  height?: number;
}

export interface FilterRequest {
  userId: string;
  uploadId: string;
  action: FilterAction;
  value?: number;
}

export class EditingService {
  private repo = getRepositoryProvider();
  private storage = getStorageClient();

  async transformUpload(params: TransformRequest): Promise<Upload> {
    const upload = await this.repo.uploads.findById(params.uploadId);
    if (!upload || upload.userId !== params.userId) {
      throw new Error('Upload not found');
    }

    const sourceBuffer = await this.fetchBuffer(upload.url);
    const sourceMeta = await sharp(sourceBuffer).metadata();
    const baseWidth = sourceMeta.width ?? 0;
    const baseHeight = sourceMeta.height ?? 0;

    if (!baseWidth || !baseHeight) {
      throw new Error('Unable to read image metadata');
    }

    const { targetWidth, targetHeight } = this.calculateTargetSize(baseWidth, baseHeight, params);

    const format = sourceMeta.format ?? 'png';
    const processedBuffer = await sharp(sourceBuffer)
      .resize(targetWidth, targetHeight, {
        fit: 'fill'
      })
      .toFormat(format as any)
      .toBuffer();

    const processedMeta = await sharp(processedBuffer).metadata();
    const width = processedMeta.width ?? targetWidth;
    const height = processedMeta.height ?? targetHeight;
    const contentType = this.formatToMime(processedMeta.format ?? format);

    const stored = await this.storage.uploadImage(processedBuffer, contentType);
    const editedUpload: Upload = {
      id: randomUUID(),
      userId: upload.userId,
      projectId: upload.projectId,
      name: upload.name ? `${upload.name} (edited)` : 'Edited asset',
      type: upload.type ?? 'other',
      storageKey: stored.key,
      url: stored.url,
      width,
      height,
      createdAt: new Date()
    };

    await this.repo.uploads.create(editedUpload);
    return editedUpload;
  }

  async applyFilter(params: FilterRequest): Promise<Upload> {
    const upload = await this.repo.uploads.findById(params.uploadId);
    if (!upload || upload.userId !== params.userId) {
      throw new Error('Upload not found');
    }

    const sourceBuffer = await this.fetchBuffer(upload.url);
    let pipeline = sharp(sourceBuffer).ensureAlpha();

    switch (params.action) {
      case 'blur': {
        const sigma = params.value && params.value > 0 ? Math.min(params.value, 20) : 3;
        pipeline = pipeline.blur(sigma);
        break;
      }
      case 'brightness': {
        const brightness = params.value && params.value > 0 ? Math.min(params.value, 3) : 1.1;
        pipeline = pipeline.modulate({ brightness });
        break;
      }
      case 'remove_background': {
        const removed = await this.removeBackground(sourceBuffer);
        pipeline = sharp(removed);
        break;
      }
      default:
        throw new Error('Unsupported action');
    }

    const processedBuffer = await pipeline.png().toBuffer();
    const processedMeta = await sharp(processedBuffer).metadata();
    const width = processedMeta.width ?? upload.width ?? 0;
    const height = processedMeta.height ?? upload.height ?? 0;
    const stored = await this.storage.uploadImage(processedBuffer, 'image/png');

    const editedUpload: Upload = {
      id: randomUUID(),
      userId: upload.userId,
      projectId: upload.projectId,
      name: upload.name ? `${upload.name} (${this.labelForAction(params.action)})` : 'Edited asset',
      type: upload.type ?? 'other',
      storageKey: stored.key,
      url: stored.url,
      width,
      height,
      createdAt: new Date()
    };

    await this.repo.uploads.create(editedUpload);
    return editedUpload;
  }

  private calculateTargetSize(
    width: number,
    height: number,
    params: TransformRequest
  ): { targetWidth: number; targetHeight: number } {
    const clamp = (value: number) => Math.max(1, Math.min(12000, Math.round(value)));

    if (params.mode === 'resize') {
      const nextWidth = params.width ?? Math.round(width * ((params.height ?? height) / height));
      const nextHeight = params.height ?? Math.round(height * (nextWidth / width));
      return {
        targetWidth: clamp(nextWidth),
        targetHeight: clamp(nextHeight)
      };
    }

    const factor =
      params.mode === 'upscale'
        ? params.scaleFactor && params.scaleFactor > 1
          ? params.scaleFactor
          : 2
        : params.scaleFactor && params.scaleFactor > 0 && params.scaleFactor < 1
          ? params.scaleFactor
          : 0.5;

    return {
      targetWidth: clamp(width * factor),
      targetHeight: clamp(height * factor)
    };
  }

  private async fetchBuffer(url: string): Promise<Buffer> {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch image (${res.status})`);
    }
    const arrayBuf = await res.arrayBuffer();
    return Buffer.from(arrayBuf);
  }

  private formatToMime(format: string | undefined): string {
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
        return 'image/png';
    }
  }

  private async removeBackground(buffer: Buffer): Promise<Buffer> {
    // Simple chroma-like removal: sample corners, remove near-corner colors.
    const { data, info } = await sharp(buffer)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const samples = [
      this.samplePixel(data, info, 0, 0),
      this.samplePixel(data, info, info.width - 1, 0),
      this.samplePixel(data, info, 0, info.height - 1),
      this.samplePixel(data, info, info.width - 1, info.height - 1),
    ];
    const bg = this.average(samples);

    const threshold = 35;
    for (let i = 0; i < info.width * info.height; i++) {
      const idx = i * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const dist = Math.sqrt((r - bg.r) ** 2 + (g - bg.g) ** 2 + (b - bg.b) ** 2);
      if (dist < threshold) {
        data[idx + 3] = 0; // alpha
      }
    }

    return sharp(data, { raw: info }).png().toBuffer();
  }

  private samplePixel(data: Buffer, info: sharp.OutputInfo, x: number, y: number) {
    const idx = (y * info.width + x) * 4;
    return { r: data[idx], g: data[idx + 1], b: data[idx + 2] };
  }

  private average(samples: Array<{ r: number; g: number; b: number }>) {
    const total = samples.reduce(
      (acc, s) => ({ r: acc.r + s.r, g: acc.g + s.g, b: acc.b + s.b }),
      { r: 0, g: 0, b: 0 }
    );
    return {
      r: Math.round(total.r / samples.length),
      g: Math.round(total.g / samples.length),
      b: Math.round(total.b / samples.length),
    };
  }

  private labelForAction(action: FilterAction) {
    switch (action) {
      case 'blur':
        return 'blurred';
      case 'brightness':
        return 'brightened';
      case 'remove_background':
        return 'bg-removed';
      default:
        return 'edited';
    }
  }
}
