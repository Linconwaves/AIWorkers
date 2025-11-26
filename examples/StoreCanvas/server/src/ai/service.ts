import { AiWorkersClient } from './aiWorkersClient';
import sharp from 'sharp';
import { getConfig } from '../config';

export class AiService {
  private client: AiWorkersClient;
  private backgroundModel: string;
  private img2imgModel: string;
  private inpaintModel: string;
  private styleModel: string;

  constructor(client = new AiWorkersClient()) {
    const config = getConfig();
    this.client = client;
    this.backgroundModel = config.BACKGROUND_MODEL_ID;
    this.img2imgModel = config.IMG2IMG_MODEL_ID;
    this.inpaintModel = config.INPAINT_MODEL_ID;
    this.styleModel = config.STYLE_LLM_MODEL_ID;
  }

  async generateBackground(
    prompt: string,
    size?: { width: number; height: number }
  ): Promise<Buffer> {
    try {
      return await this.client.generateImage({ modelId: this.backgroundModel, prompt });
    } catch (err) {
      return this.generatePlaceholder(prompt, size);
    }
  }

  async applyImg2Img(
    prompt: string,
    base64Image: string,
    size?: { width: number; height: number }
  ): Promise<Buffer> {
    try {
      return await this.client.generateImage({ modelId: this.img2imgModel, prompt, base64Image });
    } catch (err) {
      return this.generatePlaceholder(prompt, size);
    }
  }

  async applyInpaint(
    prompt: string,
    base64Image: string,
    size?: { width: number; height: number }
  ): Promise<Buffer> {
    try {
      return await this.client.generateImage({ modelId: this.inpaintModel, prompt, base64Image });
    } catch (err) {
      return this.generatePlaceholder(prompt, size);
    }
  }

  async suggestCopy(context: string): Promise<string[]> {
    try {
      const completion = await this.client.chat({
        modelId: this.styleModel,
        messages: [
          { role: 'system', content: 'You create concise marketing copy for app store assets.' },
          { role: 'user', content: context }
        ]
      });
      return completion
        .split('\n')
        .map((line) => line.replace(/^\d+[.)]\s*/, '').trim())
        .filter(Boolean)
        .slice(0, 3);
    } catch (err) {
      return [
        'Beautiful app experience in a snap',
        'Designed for every screen you ship',
        'Store-ready visuals in minutes'
      ];
    }
  }

  private async generatePlaceholder(prompt: string, size?: { width: number; height: number }) {
    const hash = [...prompt].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const color = {
      r: (hash * 53) % 255,
      g: (hash * 97) % 255,
      b: (hash * 151) % 255
    };
    const width = size?.width ?? 1920;
    const height = size?.height ?? 1080;
    return sharp({
      create: {
        width,
        height,
        channels: 3,
        background: { ...color }
      }
    })
      .png()
      .toBuffer();
  }
}
