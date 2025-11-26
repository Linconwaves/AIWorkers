import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { StorageClient } from '../src/storage/types';

let DesignService: typeof import('../src/designs/service').DesignService;
let resetRepositoryProvider: typeof import('../src/repositories').resetRepositoryProvider;
let getRepositoryProvider: typeof import('../src/repositories').getRepositoryProvider;
let initRepositoryProvider: typeof import('../src/repositories').initRepositoryProvider;

class FakeAi {
  async generateBackground(): Promise<Buffer> {
    return Buffer.from('bg');
  }
  async applyImg2Img(): Promise<Buffer> {
    return Buffer.from('img');
  }
  async suggestCopy(): Promise<string[]> {
    return ['a', 'b'];
  }
}

class FakeStorage implements StorageClient {
  uploads: { key: string; buffer: Buffer; type: string }[] = [];
  async uploadImage(buffer: Buffer, contentType: string) {
    this.uploads.push({ key: `image/${this.uploads.length}`, buffer, type: contentType });
    return { key: `image/${this.uploads.length}`, url: `http://example.com/${this.uploads.length}` };
  }
  async uploadExport(buffer: Buffer, contentType: string) {
    this.uploads.push({ key: `export/${this.uploads.length}`, buffer, type: contentType });
    return { key: `export/${this.uploads.length}`, url: `http://example.com/export/${this.uploads.length}` };
  }
  async deleteObject(): Promise<void> {
    return;
  }
}

beforeAll(async () => {
  // Set env before importing any modules that read config at load time.
  process.env.AIWORKERS_BASE_URL = 'https://aiworker.linconwaves.com';
  process.env.AIWORKER_API_KEY = 'test-key';
  process.env.BACKGROUND_MODEL_ID = 'model';
  process.env.IMG2IMG_MODEL_ID = 'model';
  process.env.INPAINT_MODEL_ID = 'model';
  process.env.STYLE_LLM_MODEL_ID = 'model';
  process.env.DB_PROVIDER = 'mongodb';
  process.env.MONGODB_URI = 'mongodb://localhost:27017/storecanvas_test';
  process.env.STORAGE_PROVIDER = 'supabase';
  process.env.SUPABASE_STORAGE_BUCKET = 'bucket';
  process.env.SUPABASE_STORAGE_URL_BASE = 'https://storage.example.com';
  process.env.SESSION_SECRET = 'supersecret';
  process.env.RATE_LIMIT_MAX = '100';
  process.env.RATE_LIMIT_WINDOW = '60000';
  process.env.JWT_SECRET = 'jwtsecretjwtsecret';

  ({ DesignService } = await import('../src/designs/service'));
  ({
    resetRepositoryProvider,
    getRepositoryProvider,
    initRepositoryProvider
  } = await import('../src/repositories'));
});

describe('DesignService', () => {
  beforeEach(async () => {
    resetRepositoryProvider();
    await initRepositoryProvider({ forceInMemory: true });
  });

  it('creates exports for presets', async () => {
    const repo = getRepositoryProvider();
    const user = await repo.users.create({
      id: 'user',
      email: 'test@example.com',
      name: 'Test',
      role: 'user'
    });
    const project = await repo.projects.create({
      id: 'project',
      userId: user.id,
      name: 'Proj',
      platforms: ['ios'],
      brandKit: {},
      defaultScreenshotBackgroundStyle: ''
    });
    const storage = new FakeStorage();
    const service = new DesignService({ ai: new FakeAi(), storage, repo });
    const design = await service.create(user.id, project.id, {
      id: 'design',
      projectId: project.id,
      name: 'Design',
      type: 'feature_graphic',
      baseWidth: 4000,
      baseHeight: 4000,
      layers: [],
      status: 'draft',
      aiMetadata: {},
      createdAt: new Date(),
      updatedAt: new Date()
    } as any);
    const result = await service.exportDesign(user.id, design.id, ['apple_iphone_6_7_portrait'], 'png');
    expect(result[0].width).toBe(1290);
    expect(storage.uploads.length).toBeGreaterThan(0);
  });
});
