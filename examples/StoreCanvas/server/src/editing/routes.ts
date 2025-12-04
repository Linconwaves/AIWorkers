import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { validateSchema } from '../common/validation';
import { EditingService } from './service';

const transformSchema = z.object({
  uploadId: z.string().min(1),
  mode: z.enum(['upscale', 'downscale', 'resize']),
  scaleFactor: z.number().positive().optional(),
  width: z.number().int().positive().max(12000).optional(),
  height: z.number().int().positive().max(12000).optional(),
});

const filterSchema = z.object({
  uploadId: z.string().min(1),
  action: z.enum(['blur', 'brightness', 'remove_background']),
  value: z.number().positive().optional(),
});

const convertSchema = z.object({
  uploadId: z.string().min(1),
  format: z.enum(['png', 'jpeg', 'webp', 'avif']),
});

export const registerEditingRoutes = (app: FastifyInstance) => {
  const service = new EditingService();

  app.post('/editing/transform', { preHandler: [app.authenticate] }, async (request: any) => {
    const userId = request.authUser.id as string;
    const body = validateSchema(transformSchema, request.body);
    const upload = await service.transformUpload({
      userId,
      uploadId: body.uploadId,
      mode: body.mode,
      scaleFactor: body.scaleFactor,
      width: body.width,
      height: body.height,
    });
    return { upload };
  });

  app.post('/editing/filter', { preHandler: [app.authenticate] }, async (request: any) => {
    const userId = request.authUser.id as string;
    const body = validateSchema(filterSchema, request.body);
    const upload = await service.applyFilter({
      userId,
      uploadId: body.uploadId,
      action: body.action,
      value: body.value,
    });
    return { upload };
  });

  app.post('/editing/convert', { preHandler: [app.authenticate] }, async (request: any) => {
    const userId = request.authUser.id as string;
    const body = validateSchema(convertSchema, request.body);
    const upload = await service.convertFormat({
      userId,
      uploadId: body.uploadId,
      format: body.format,
    });
    return { upload };
  });
};
