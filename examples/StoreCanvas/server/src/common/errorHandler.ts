import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { AppError } from './errors';
import { logger } from '../logging/logger';

export const registerErrorHandler = (app: FastifyInstance) => {
  app.setErrorHandler((err: unknown, request: FastifyRequest, reply: FastifyReply) => {
    if (err instanceof AppError) {
      logger.warn({ err, requestId: request.id }, err.message);
      return reply.status(err.statusCode).send({
        error: err.message,
        details: err.details,
        requestId: request.id
      });
    }

    logger.error({ err, requestId: request.id }, 'Unexpected error');
    return reply.status(500).send({
      error: 'Internal Server Error',
      requestId: request.id
    });
  });
};
