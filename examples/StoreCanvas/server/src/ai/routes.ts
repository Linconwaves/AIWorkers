import { FastifyInstance } from 'fastify';
import { validateSchema } from '../common/validation';
import { z } from 'zod';
import { UploadService } from '../uploads/service';
import { generatePlaceholder } from './actions';
import { AiWorkerClient } from './aiWorkerClient';

const createSchema = z.object({
  mode: z.enum(['art', 'power_editor', 'characters', 'logos', 'stock', 'backgrounds', 'anime']),
  prompt: z.string().optional(),
});

const portraitSchema = z.object({
  mode: z.enum([
    'general',
    'corporate',
    'lunar_new_year',
    'avatar',
    'cosplay',
    'real_estate',
    'medical',
    'xmas',
    'profile_editor',
  ]),
});

const enhanceSchema = z.object({
  action: z.enum([
    'upscale',
    'remove_object',
    'remove_background',
    'restyle',
    'colorize',
    'restore',
    'face_enhance',
    'auto_crop',
    'color_palette',
  ]),
  uploadId: z.string().min(1),
});

const gameSchema = z.object({
  mode: z.enum(['tools', 'characters', 'background', 'copywriter', 'logo', 'dnd']),
  uploadId: z.string().optional(),
});

export const registerAiActionRoutes = (app: FastifyInstance) => {
  const uploads = new UploadService();
  const aiClient = new AiWorkerClient();

  app.post('/ai/create', { preHandler: [app.authenticate] }, async (request: any) => {
    const userId = request.authUser.id;
    const body = validateSchema(createSchema, request.body);

    const refinedPrompt = await aiClient
      .chat(
        'You refine prompts for an image model. Keep them concise but descriptive; return only the prompt.',
        body.prompt || `Create a ${body.mode} concept`
      )
      .catch(() => body.prompt || `Create a ${body.mode} concept`);

    const buffer = await aiClient
      .generateImage({ model: 'phoenix-1p0', prompt: refinedPrompt })
      .catch(() => generatePlaceholder(`Create: ${body.mode}`));
    const upload = await uploads.createFromBuffer(
      userId,
      undefined,
      'other',
      buffer,
      'image/png',
      `create-${body.mode}.png`
    );
    return { upload };
  });

  app.post('/ai/portraits', { preHandler: [app.authenticate] }, async (request: any) => {
    const userId = request.authUser.id;
    const body = validateSchema(portraitSchema, request.body);
    const refinedPrompt = await aiClient
      .chat(
        'You write short portrait prompts. Include style cues like lighting and background; return only the prompt.',
        `Portrait style: ${body.mode}`
      )
      .catch(() => `Portrait style: ${body.mode}`);

    const buffer = await aiClient
      .generateImage({ model: 'lucid-origin', prompt: refinedPrompt })
      .catch(() => generatePlaceholder(`Portrait: ${body.mode}`, 1024, 1280));
    const upload = await uploads.createFromBuffer(
      userId,
      undefined,
      'other',
      buffer,
      'image/png',
      `portrait-${body.mode}.png`
    );
    return { upload };
  });

  app.post('/ai/enhance', { preHandler: [app.authenticate] }, async (request: any, reply) => {
    const userId = request.authUser.id;
    const body = validateSchema(enhanceSchema, request.body);
    const source = await uploads.get(userId, body.uploadId);
    if (!source) {
      reply.notFound('Upload not found');
      return;
    }

    const actionPrompt = `Enhance image: ${body.action}`;
    const refinedPrompt = await aiClient
      .chat(
        'You produce concise enhancement directions for an image-to-image model. Be brief.',
        `${actionPrompt}. Keep subject intact.`
      )
      .catch(() => actionPrompt);

    const buffer = await aiClient
      .generateImage({
        model: 'sd-v1-5-img2img',
        prompt: refinedPrompt,
        extra: source.url ? { image: source.url } : undefined,
      })
      .catch(() => generatePlaceholder(`Enhance: ${body.action}`, source.width ?? 1200, source.height ?? 1600));
    const upload = await uploads.createFromBuffer(
      userId,
      source.projectId,
      source.type ?? 'other',
      buffer,
      'image/png',
      `${source.name || 'asset'}-${body.action}.png`
    );
    return { upload };
  });

  app.post('/ai/game', { preHandler: [app.authenticate] }, async (request: any, reply) => {
    const userId = request.authUser.id;
    const body = validateSchema(gameSchema, request.body);

    const baseUpload =
      body.uploadId && (await uploads.get(userId, body.uploadId));

    const refinedPrompt = await aiClient
      .chat(
        'You write short prompts for game assets; mention mood/style and keep under 40 words.',
        `Game asset: ${body.mode}`
      )
      .catch(() => `Game asset: ${body.mode}`);

    const buffer = await aiClient
      .generateImage({
        model: 'flux-1-schnell',
        prompt: refinedPrompt,
        extra: baseUpload?.url ? { image: baseUpload.url } : undefined,
      })
      .catch(() => generatePlaceholder(`Game: ${body.mode}`, baseUpload?.width ?? 1400, baseUpload?.height ?? 900));
    const upload = await uploads.createFromBuffer(
      userId,
      baseUpload?.projectId,
      baseUpload?.type ?? 'other',
      buffer,
      'image/png',
      `game-${body.mode}.png`
    );
    return { upload };
  });
};
