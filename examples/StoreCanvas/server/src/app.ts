import Fastify from 'fastify';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import formbody from '@fastify/formbody';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import { requestIdHook } from './common/requestContext';
import { registerErrorHandler } from './common/errorHandler';
import { loggerOptions } from './logging/logger';
import { getConfig } from './config';
import { registerAuthRoutes } from './auth/routes';
import { registerProjectRoutes } from './projects/routes';
import { registerDesignRoutes } from './designs/routes';
import { registerPresetRoutes } from './presets/routes';
import { registerUploadRoutes } from './uploads/routes';
import { registerHealthRoute } from './common/health';

export const buildApp = () => {
  const config = getConfig();
  const app = Fastify({
    logger: loggerOptions,
    trustProxy: true,
    disableRequestLogging: config.NODE_ENV === 'production'
  });

  app.addHook('onRequest', requestIdHook);

  app.register(cors, { origin: true, credentials: true });
  app.register(sensible);
  app.register(formbody);
  app.register(multipart);
  app.register(cookie, { secret: config.SESSION_SECRET });
  app.register(rateLimit, {
    max: config.RATE_LIMIT_MAX,
    timeWindow: config.RATE_LIMIT_WINDOW,
    skipOnError: true,
    keyGenerator: (request: any) => {
      return request.authUser?.id ?? request.ip;
    }
  });
  app.register(jwt, {
    secret: config.JWT_SECRET,
    cookie: {
      cookieName: 'storecanvas_token',
      signed: false
    }
  });

  registerHealthRoute(app);
  registerAuthRoutes(app);
  registerProjectRoutes(app);
  registerDesignRoutes(app);
  registerPresetRoutes(app);
  registerUploadRoutes(app);

  registerErrorHandler(app);

  return app;
};
