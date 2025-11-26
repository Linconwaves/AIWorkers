import { FastifyInstance } from 'fastify';
import { UploadService } from './service';
import fetch from 'node-fetch';

export const registerUploadRoutes = (app: FastifyInstance) => {
  const service = new UploadService();

  app.get('/uploads', { preHandler: [app.authenticate] }, async (request: any) => {
    const userId = request.authUser.id;
    return service.list(userId);
  });

  app.post('/uploads', { preHandler: [app.authenticate] }, async (request: any, reply) => {
    const userId = request.authUser.id;
    const data = await request.file();
    if (!data) {
      reply.badRequest('File is required');
      return;
    }
    const buffer = await data.toBuffer();
    const upload = await service.createFromBuffer(
      userId,
      (request.body as any)?.projectId,
      ((request.body as any)?.type ?? 'other') as any,
      buffer,
      data.mimetype
    );
    return upload;
  });

  app.delete('/uploads/:id', { preHandler: [app.authenticate] }, async (request: any) => {
    const userId = request.authUser.id;
    const { id } = request.params as { id: string };
    await service.delete(userId, id);
    return { success: true };
  });

  // CORS-friendly proxy for stored images (e.g., R2) to avoid canvas tainting issues.
  app.get('/uploads/proxy', async (request: any, reply) => {
    const url = (request.query as any)?.url as string | undefined;
    if (!url) {
      return reply.badRequest('url is required');
    }
    try {
      const res = await fetch(url);
      if (!res.ok) {
        reply.code(res.status);
        return reply.send('Failed to fetch resource');
      }
      reply.header('Access-Control-Allow-Origin', '*');
      if (res.headers.get('content-type')) {
        reply.header('Content-Type', res.headers.get('content-type') as string);
      }
      return reply.send(await res.arrayBuffer());
    } catch (err: any) {
      reply.code(502);
      return reply.send('Proxy fetch failed');
    }
  });
};
