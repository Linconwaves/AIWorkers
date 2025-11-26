import fetch, { Headers } from 'node-fetch';
import { getConfig } from '../config';
import { logger } from '../logging/logger';

interface GenerateImageParams {
  modelId: string;
  prompt: string;
  base64Image?: string;
}

interface ChatParams {
  modelId: string;
  messages: { role: 'system' | 'user'; content: string }[];
}

export class AiWorkersClient {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    const config = getConfig();
    this.baseUrl = config.AIWORKERS_BASE_URL;
    this.apiKey = config.AIWORKER_API_KEY;
  }

  async generateImage(params: GenerateImageParams): Promise<Buffer> {
    const response = await fetch(`${this.baseUrl}/${encodeURIComponent(params.modelId)}`, {
      method: 'POST',
      headers: this.authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        prompt: params.prompt,
        image: params.base64Image
      })
    });
    if (!response.ok) {
      const text = await response.text();
      logger.warn(
        { status: response.status, text, url: `${this.baseUrl}/${params.modelId}` },
        'AI image generation failed'
      );
      throw new Error('AI image generation failed');
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  async chat(params: ChatParams): Promise<string> {
    const response = await fetch(`${this.baseUrl}/${encodeURIComponent(params.modelId)}`, {
      method: 'POST',
      headers: this.authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ messages: params.messages })
    });
    if (!response.ok) {
      const text = await response.text();
      logger.warn({ status: response.status, text }, 'AI chat request failed');
      throw new Error('AI chat request failed');
    }
    type ChatCompletionResponse = {
      choices?: { message?: { content?: string } }[];
      response?: string;
      text?: string;
    };
    const data = (await response.json()) as ChatCompletionResponse;
    const fromChoices = data?.choices?.[0]?.message?.content;
    return fromChoices ?? data?.response ?? data?.text ?? '';
  }

  private authHeaders(extra?: HeadersInit): Headers {
    const headers = new Headers(extra);
    headers.set('Authorization', `Bearer ${this.apiKey}`);
    return headers;
  }
}
