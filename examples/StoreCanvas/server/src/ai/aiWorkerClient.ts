import fetch from 'node-fetch';
import { getConfig } from '../config';

type ImageModel =
  | 'phoenix-1p0'
  | 'sd-v1-5-img2img'
  | 'lucid-origin'
  | 'flux-1-schnell';

const B64_FIELDS = ['image', 'result.image', 'result.data', 'data'];

export class AiWorkerClient {
  private base = getConfig().AIWORKERS_BASE_URL;
  private apiKey = getConfig().AIWORKER_API_KEY;

  async generateImage(params: { model: ImageModel; prompt: string; extra?: Record<string, unknown> }) {
    const res = await fetch(`${this.base}/${params.model}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ prompt: params.prompt, ...(params.extra || {}) }),
    });

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('image')) {
      const arrayBuf = await res.arrayBuffer();
      return Buffer.from(arrayBuf);
    }

    const json = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error((json as any)?.error || `Model error (${res.status})`);
    }

    const b64 = this.extractBase64(json);
    if (b64) {
      return Buffer.from(b64, 'base64');
    }
    throw new Error('No image data returned');
  }

  async chat(systemPrompt: string, userPrompt: string) {
    const res = await fetch(`${this.base}/gpt-oss-20b`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error((data as any)?.error || `LLM error (${res.status})`);
    }
    const text =
      (data as any).response ||
      (data as any).text ||
      (Array.isArray((data as any).choices)
        ? (data as any).choices.map((c: any) => c?.message?.content).find((t: any) => typeof t === 'string')
        : undefined);
    if (!text) throw new Error('LLM returned no text');
    return text;
  }

  private extractBase64(json: any) {
    for (const key of B64_FIELDS) {
      const val = key.split('.').reduce((acc, part) => (acc ? acc[part] : undefined), json);
      if (typeof val === 'string') return val;
    }
    return null;
  }
}
