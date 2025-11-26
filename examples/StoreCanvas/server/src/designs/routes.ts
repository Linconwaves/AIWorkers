import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { DesignService } from './service';
import { validateSchema } from '../common/validation';

const createDesignSchema = z.object({
  name: z.string(),
  type: z.enum(['feature_graphic', 'phone_screenshot', 'tablet_screenshot', 'app_icon_layout', 'custom']),
  baseWidth: z.number().min(320),
  baseHeight: z.number().min(320),
  layers: z.array(z.any()).default([]),
  aiMetadata: z.record(z.any()).optional(),
  status: z.enum(['draft', 'ready', 'archived']).default('draft')
});

const updateDesignSchema = createDesignSchema.partial();

export const registerDesignRoutes = (app: FastifyInstance) => {
  const service = new DesignService();

  app.get('/projects/:projectId/designs', { preHandler: [app.authenticate] }, async (request: any) => {
    const userId = request.authUser.id;
    const { projectId } = request.params as { projectId: string };
    return service.list(userId, projectId);
  });

  app.post('/projects/:projectId/designs', { preHandler: [app.authenticate] }, async (request: any) => {
    const userId = request.authUser.id;
    const { projectId } = request.params as { projectId: string };
    const body = validateSchema(createDesignSchema, request.body);
    return service.create(userId, projectId, body as any);
  });

  app.get('/designs/:id', { preHandler: [app.authenticate] }, async (request: any) => {
    const userId = request.authUser.id;
    const { id } = request.params as { id: string };
    return service.get(userId, id);
  });

  app.put('/designs/:id', { preHandler: [app.authenticate] }, async (request: any) => {
    const userId = request.authUser.id;
    const { id } = request.params as { id: string };
    const body = validateSchema(updateDesignSchema, request.body);
    return service.update(userId, id, body as any);
  });

  app.delete('/designs/:id', { preHandler: [app.authenticate] }, async (request: any) => {
    const userId = request.authUser.id;
    const { id } = request.params as { id: string };
    await service.delete(userId, id);
    return { success: true };
  });

  app.post('/designs/:id/generate-background', { preHandler: [app.authenticate] }, async (request: any) => {
    const userId = request.authUser.id;
    const { id } = request.params as { id: string };
    const body = request.body as { prompt: string };
    return service.generateBackground(userId, id, body.prompt);
  });

  app.post('/designs/:id/suggest-copy', { preHandler: [app.authenticate] }, async (request: any) => {
    const userId = request.authUser.id;
    const { id } = request.params as { id: string };
    const body = request.body as { context: string };
    const options = await service.suggestCopy(userId, id, body.context);
    return { options };
  });

  app.post('/designs/:id/apply-img2img', { preHandler: [app.authenticate] }, async (request: any) => {
    const userId = request.authUser.id;
    const { id } = request.params as { id: string };
    const body = request.body as { prompt: string; base64Image: string };
    return service.applyImg2Img(userId, id, body.prompt, body.base64Image);
  });

  app.post('/designs/:id/export', { preHandler: [app.authenticate] }, async (request: any) => {
    const userId = request.authUser.id;
    const { id } = request.params as { id: string };
    const body = request.body as { sizePresetCodes: string[]; format: 'png' | 'jpeg' };
    const exports = await service.exportDesign(userId, id, body.sizePresetCodes, body.format);
    return { exports };
  });

  app.get('/designs/:id/exports', { preHandler: [app.authenticate] }, async (request: any) => {
    const userId = request.authUser.id;
    const { id } = request.params as { id: string };
    return service.listExports(userId, id);
  });
};
