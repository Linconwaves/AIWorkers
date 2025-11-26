import { FastifyInstance } from 'fastify';
import { PresetService } from './service';

export const registerPresetRoutes = (app: FastifyInstance) => {
  const service = new PresetService();

  app.get('/size-presets', async (request) => {
    const store = (request.query as any)?.store as string | undefined;
    const category = (request.query as any)?.category as string | undefined;
    return service.listPresets(store, category);
  });
};
