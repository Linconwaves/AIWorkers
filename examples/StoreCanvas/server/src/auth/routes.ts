import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { AuthService } from './service';
import { validateSchema } from '../common/validation';
import { AuthError } from '../common/errors';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: any, reply: any) => Promise<void>;
  }
  interface FastifyRequest {
    authUser?: { id: string; email: string };
  }
}

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

const resetRequestSchema = z.object({
  email: z.string().email()
});

const resetCompleteSchema = z.object({
  email: z.string().email(),
  code: z.string().min(4).max(8),
  newPassword: z.string().min(6)
});

export const registerAuthRoutes = (app: FastifyInstance) => {
  const service = new AuthService();

  app.decorate('authenticate', async (request, reply) => {
    try {
      await request.jwtVerify();
      const payload = request.user as any;
      request.authUser = { id: payload.sub, email: payload.email };
    } catch {
      throw new AuthError();
    }
  });

  app.post('/auth/signup', async (request, reply) => {
    const body = validateSchema(signupSchema, request.body);
    const user = await service.signup(body.email, body.password, body.name);
    const token = app.jwt.sign({ sub: user.id, email: user.email });
    reply.setCookie('storecanvas_token', token, { httpOnly: true, path: '/' });
    return { user, token };
  });

  app.post('/auth/login', async (request, reply) => {
    const body = validateSchema(loginSchema, request.body);
    const user = await service.login(body.email, body.password);
    const token = app.jwt.sign({ sub: user.id, email: user.email });
    reply.setCookie('storecanvas_token', token, { httpOnly: true, path: '/' });
    return { user, token };
  });

  app.post('/auth/reset/request', async (request) => {
    const body = validateSchema(resetRequestSchema, request.body);
    const { code, shouldSend } = await service.requestPasswordReset(body.email);
    if (shouldSend && code) {
      const { sendResetEmail } = await import('./email');
      await sendResetEmail(body.email, code);
    }
    return { sent: true };
  });

  app.post('/auth/reset/complete', async (request) => {
    const body = validateSchema(resetCompleteSchema, request.body);
    await service.resetPassword(body.email, body.code, body.newPassword);
    return { reset: true };
  });

  app.post('/auth/logout', async (_request, reply) => {
    reply.clearCookie('storecanvas_token', { path: '/' });
    return { success: true };
  });

  app.get('/auth/me', { preHandler: [app.authenticate] }, async (request) => {
    const userId = (request.authUser as any)?.id;
    if (!userId) throw new AuthError();
    const user = await service.getUserById(userId);
    if (!user) throw new AuthError();
    return { user };
  });
};
