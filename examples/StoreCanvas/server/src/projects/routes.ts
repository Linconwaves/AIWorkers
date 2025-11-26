import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ProjectService } from './service';
import { validateSchema } from '../common/validation';

const projectSchema = z.object({
  name: z.string(),
  platforms: z.array(z.string()).default([]),
  brandKit: z.record(z.any()).default({})
});

export const registerProjectRoutes = (app: FastifyInstance) => {
  const service = new ProjectService();

  app.get('/projects', { preHandler: [app.authenticate] }, async (request: any) => {
    const userId = request.authUser.id;
    return service.list(userId);
  });

  app.post('/projects', { preHandler: [app.authenticate] }, async (request: any) => {
    const userId = request.authUser.id;
    const body = validateSchema(projectSchema, request.body);
    return service.create(userId, { ...body, platforms: body.platforms ?? [] });
  });

  app.get('/projects/:id', { preHandler: [app.authenticate] }, async (request: any) => {
    const userId = request.authUser.id;
    const { id } = request.params as { id: string };
    return service.get(userId, id);
  });

  app.put('/projects/:id', { preHandler: [app.authenticate] }, async (request: any) => {
    const userId = request.authUser.id;
    const { id } = request.params as { id: string };
    const body = validateSchema(projectSchema.partial(), request.body);
    return service.update(userId, id, body);
  });

  app.delete('/projects/:id', { preHandler: [app.authenticate] }, async (request: any) => {
    const userId = request.authUser.id;
    const { id } = request.params as { id: string };
    await service.delete(userId, id);
    return { success: true };
  });
};
