import sharp from 'sharp';
import { randomUUID } from 'crypto';
import { getRepositoryProvider } from '../repositories';
import { AiService } from '../ai/service';
import { getStorageClient } from '../storage';
import { Design, LayerBase } from '../repositories/types';
import { NotFoundError, ValidationError } from '../common/errors';
import { PresetService } from '../presets/service';
import { logger } from '../logging/logger';

export class DesignService {
  private repo = getRepositoryProvider();
  private ai: AiService;
  private storage = getStorageClient();
  private presets: PresetService;

  constructor(
    deps?: {
      ai?: AiService;
      presets?: PresetService;
      storage?: ReturnType<typeof getStorageClient>;
      repo?: ReturnType<typeof getRepositoryProvider>;
    }
  ) {
    this.repo = deps?.repo ?? getRepositoryProvider();
    this.ai = deps?.ai ?? new AiService();
    this.presets = deps?.presets ?? new PresetService();
    this.storage = deps?.storage ?? getStorageClient();
  }

  async list(userId: string, projectId: string): Promise<Design[]> {
    await this.ensureProjectOwnership(userId, projectId);
    return this.repo.designs.listByProject(projectId);
  }

  async create(
    userId: string,
    projectId: string,
    payload: Omit<Design, 'id' | 'createdAt' | 'updatedAt' | 'projectId'>
  ): Promise<Design> {
    await this.ensureProjectOwnership(userId, projectId);
    return this.repo.designs.create({
      ...payload,
      projectId,
      id: undefined as any
    });
  }

  async update(userId: string, id: string, updates: Partial<Design>): Promise<Design> {
    const design = await this.repo.designs.findById(id);
    if (!design) throw new NotFoundError('Design not found');
    await this.ensureProjectOwnership(userId, design.projectId);
    const updated = await this.repo.designs.update(id, { ...updates, updatedAt: new Date() });
    if (!updated) throw new NotFoundError('Design not found');
    return updated;
  }

  async get(userId: string, id: string): Promise<Design> {
    const design = await this.repo.designs.findById(id);
    if (!design) throw new NotFoundError('Design not found');
    await this.ensureProjectOwnership(userId, design.projectId);
    return design;
  }

  async delete(userId: string, id: string) {
    const design = await this.repo.designs.findById(id);
    if (!design) throw new NotFoundError('Design not found');
    await this.ensureProjectOwnership(userId, design.projectId);
    await this.repo.designs.delete(id);
  }

  async generateBackground(userId: string, id: string, prompt: string): Promise<Design> {
    const design = await this.get(userId, id);
    const buffer = await this.ai.generateBackground(prompt, {
      width: design.baseWidth,
      height: design.baseHeight
    });
    let sourceUrl: string;
    try {
      const upload = await this.storage.uploadImage(buffer, 'image/png');
      sourceUrl = upload.url;
    } catch (err) {
      logger.warn({ err }, 'Storage upload failed, using inline background');
      sourceUrl = `data:image/png;base64,${buffer.toString('base64')}`;
    }
    const backgroundLayer: LayerBase = {
      id: randomUUID(),
      type: 'background',
      size: { width: design.baseWidth, height: design.baseHeight },
      position: { x: 0, y: 0 },
      opacity: 1,
      zIndex: 0,
      source: sourceUrl,
      data: {
        type: 'image',
        url: sourceUrl,
        width: design.baseWidth,
        height: design.baseHeight,
        x: 0,
        y: 0,
        opacity: 1,
        rotation: 0,
      },
    };
    const updatedLayers = [backgroundLayer, ...(design.layers ?? [])];
    return this.update(userId, id, {
      layers: updatedLayers,
      aiMetadata: { ...(design.aiMetadata ?? {}), lastBackgroundPrompt: prompt, model: 'background' }
    });
  }

  async suggestCopy(userId: string, id: string, context: string) {
    await this.get(userId, id);
    return this.ai.suggestCopy(context);
  }

  async applyImg2Img(userId: string, id: string, prompt: string, base64Image: string): Promise<Design> {
    const design = await this.get(userId, id);
    const buffer = await this.ai.applyImg2Img(prompt, base64Image, {
      width: design.baseWidth,
      height: design.baseHeight
    });
    let sourceUrl: string;
    try {
      const upload = await this.storage.uploadImage(buffer, 'image/png');
      sourceUrl = upload.url;
    } catch (err) {
      logger.warn({ err }, 'Storage upload failed, using inline overlay');
      sourceUrl = `data:image/png;base64,${buffer.toString('base64')}`;
    }
    const updatedLayers = [
      ...(design.layers ?? []),
      {
        id: randomUUID(),
        type: 'overlay',
        opacity: 1,
        zIndex: 10,
        source: sourceUrl
      }
    ];
    return this.update(userId, id, {
      layers: updatedLayers,
      aiMetadata: { ...(design.aiMetadata ?? {}), lastImg2ImgPrompt: prompt }
    });
  }

  async exportDesign(
    userId: string,
    id: string,
    sizePresetCodes: string[],
    format: 'png' | 'jpeg'
  ) {
    const design = await this.get(userId, id);
    const presets = this.presets.getByCodes(sizePresetCodes);
    const baseComposition = await this.renderBaseComposition(design);

    const exports = [];
    for (const preset of presets) {
      this.presets.validateExport(preset, design.baseWidth, design.baseHeight, format);
      const resized = await sharp(baseComposition)
        .resize(preset.width, preset.height, { fit: 'cover' })
        .toFormat(format === 'png' ? 'png' : 'jpeg')
        .toBuffer();
      const upload = await this.storage.uploadExport(
        resized,
        format === 'png' ? 'image/png' : 'image/jpeg'
      );
      const record = await this.repo.exports.create({
        id: undefined as any,
        designId: id,
        sizePresetId: preset.id,
        store: preset.store,
        outputUrl: upload.url,
        format,
        width: preset.width,
        height: preset.height,
        generatedByJobId: undefined
      });
      exports.push(record);
    }
    return exports;
  }

  async listExports(userId: string, id: string) {
    await this.get(userId, id);
    return this.repo.exports.listByDesign(id);
  }

  private async renderBaseComposition(design: Design): Promise<Buffer> {
    // Placeholder renderer: solid background; replace with real layer renderer.
    const base = sharp({
      create: {
        width: design.baseWidth,
        height: design.baseHeight,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    });
    return base.png().toBuffer();
  }

  private async ensureProjectOwnership(userId: string, projectId: string) {
    const project = await this.repo.projects.findById(projectId);
    if (!project || project.userId !== userId) {
      throw new ValidationError('Project not found or not owned by user');
    }
  }
}
