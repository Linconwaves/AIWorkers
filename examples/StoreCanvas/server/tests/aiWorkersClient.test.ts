import { describe, expect, it, vi, beforeAll } from 'vitest';

// Set env before modules load.
vi.hoisted(() => {
  process.env.AIWORKERS_BASE_URL = 'https://aiworker.linconwaves.com';
  process.env.AIWORKER_API_KEY = 'lW_AI_7ec0c465c359b29f43e265695749dd63';
  process.env.BACKGROUND_MODEL_ID = 'sdxl-base-1p0';
  process.env.IMG2IMG_MODEL_ID = 'sd-v1-5-img2img';
  process.env.INPAINT_MODEL_ID = 'sd-v1-5-inpainting';
  process.env.STYLE_LLM_MODEL_ID = 'gemma-3-12b-it';
  process.env.DB_PROVIDER = 'mongodb';
  process.env.MONGODB_URI = 'mongodb://localhost:27017/storecanvas_test';
  process.env.STORAGE_PROVIDER = 'supabase';
  process.env.SUPABASE_STORAGE_BUCKET = 'bucket';
  process.env.SUPABASE_STORAGE_URL_BASE = 'https://storage.example.com';
  process.env.SESSION_SECRET = 'supersecret';
  process.env.RATE_LIMIT_MAX = '100';
  process.env.RATE_LIMIT_WINDOW = '60000';
  process.env.JWT_SECRET = 'jwtsecretjwtsecret';
});

import { AiWorkersClient } from '../src/ai/aiWorkersClient';

// Ensure mocks are available during hoisting.
const { mockFetch, MockHeaders } = vi.hoisted(() => {
  class MockHeaders {
    private map = new Map<string, string>();
    constructor(init?: any) {
      if (init) {
        Object.entries(init).forEach(([k, v]) => this.map.set(k.toLowerCase(), String(v)));
      }
    }
    set(key: string, value: string) {
      this.map.set(key.toLowerCase(), value);
    }
  }
  return { mockFetch: vi.fn(), MockHeaders };
});

vi.mock('node-fetch', () => ({
  default: mockFetch,
  Headers: MockHeaders
}));

beforeAll(() => {
  process.env.AIWORKERS_BASE_URL = 'https://aiworker.linconwaves.com';
  process.env.AIWORKER_API_KEY = 'lW_AI_7ec0c465c359b29f43e265695749dd63';
  process.env.BACKGROUND_MODEL_ID = 'sdxl-base-1p0';
  process.env.IMG2IMG_MODEL_ID = 'sd-v1-5-img2img';
  process.env.INPAINT_MODEL_ID = 'sd-v1-5-inpainting';
  process.env.STYLE_LLM_MODEL_ID = 'gemma-3-12b-it';
  process.env.DB_PROVIDER = 'mongodb';
  process.env.MONGODB_URI = 'mongodb://localhost:27017/storecanvas_test';
  process.env.STORAGE_PROVIDER = 'supabase';
  process.env.SUPABASE_STORAGE_BUCKET = 'bucket';
  process.env.SUPABASE_STORAGE_URL_BASE = 'https://storage.example.com';
  process.env.SESSION_SECRET = 'supersecret';
  process.env.RATE_LIMIT_MAX = '100';
  process.env.RATE_LIMIT_WINDOW = '60000';
  process.env.JWT_SECRET = 'jwtsecretjwtsecret';
});

describe('AiWorkersClient', () => {
  it('sends generate image requests with auth header', async () => {
    const buffer = Buffer.from('image');
    mockFetch.mockResolvedValueOnce({
      ok: true,
      arrayBuffer: async () => buffer
    });
    const client = new AiWorkersClient();
    const result = await client.generateImage({ modelId: 'model', prompt: 'test' });
    expect(result.equals(buffer)).toBe(true);
    const call = mockFetch.mock.calls[0];
    expect(call[0]).toBe('https://aiworker.linconwaves.com/model');
  });
});
