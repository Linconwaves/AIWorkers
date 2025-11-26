import { FastifyReply, FastifyRequest } from 'fastify';
import { randomUUID } from 'crypto';

export const requestIdHook = async (request: FastifyRequest, reply: FastifyReply) => {
  const incomingId = request.headers['x-request-id'] as string | undefined;
  const id = incomingId ?? randomUUID();
  request.id = id;
  reply.header('x-request-id', id);
};
