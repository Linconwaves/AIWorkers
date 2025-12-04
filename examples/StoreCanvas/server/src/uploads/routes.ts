import { FastifyInstance } from 'fastify';
import { UploadService } from './service';
import fetch from 'node-fetch';

export const registerUploadRoutes = (app: FastifyInstance) => {
  const service = new UploadService();

  app.get('/uploads', { preHandler: [app.authenticate] }, async (request: any) => {
    const userId = request.authUser.id;
    const projectId = (request.query as any)?.projectId as string | undefined;
    const uploads = await service.list(userId);
    return projectId ? uploads.filter((u) => u.projectId === projectId) : uploads;
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
      data.mimetype,
      (data as any)?.filename
    );
    return upload;
  });

  app.delete('/uploads/:id', { preHandler: [app.authenticate] }, async (request: any) => {
    const userId = request.authUser.id;
    const { id } = request.params as { id: string };
    await service.delete(userId, id);
    return { success: true };
  });

  app.patch('/uploads/:id', { preHandler: [app.authenticate] }, async (request: any, reply) => {
    const userId = request.authUser.id;
    const { id } = request.params as { id: string };
    const name = (request.body as any)?.name;
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      reply.badRequest('name is required');
      return;
    }
    const updated = await service.rename(userId, id, name);
    if (!updated) {
      reply.notFound('Upload not found');
      return;
    }
    return updated;
  });

  app.get('/uploads/:id/download', { preHandler: [app.authenticate] }, async (request: any, reply) => {
    const userId = request.authUser.id;
    const { id } = request.params as { id: string };
    const filenameParam = ((request.query as any)?.filename as string | undefined)?.trim();

    const upload = await service.get(userId, id);
    if (!upload) {
      reply.notFound('Upload not found');
      return;
    }

    try {
      const res = await fetch(upload.url);
      if (!res.ok) {
        reply.code(502);
        return reply.send('Failed to fetch file');
      }
      const arrayBuf = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuf);
      const mime = upload.mimeType || res.headers.get('content-type') || 'application/octet-stream';
      const safeName = filenameParam && filenameParam.length > 0 ? filenameParam.replace(/[^\w.-]/g, '_') : upload.name || 'asset';

      reply
        .header('Content-Type', mime)
        .header('Content-Length', buffer.byteLength)
        .header('Content-Disposition', `attachment; filename="${safeName}"`);

      return reply.send(buffer);
    } catch (err: any) {
      reply.code(502);
      return reply.send('Download failed');
    }
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
