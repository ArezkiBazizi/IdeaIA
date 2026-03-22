/**
 * SSE via stream Node + reply.send (Fastify) : CORS et cycle de vie corrects.
 * reply.hijack() + raw peut laisser Fastify finaliser avec une réponse vide / 204 côté client.
 */
import { PassThrough } from 'node:stream';

/**
 * @param {import('fastify').FastifyReply} reply
 * @param {import('fastify').FastifyRequest} request
 * @returns {{ stream: import('stream').PassThrough; write: (obj: object) => void; end: () => void }}
 */
export function createSseReply(reply, request) {
  const origin = request.headers.origin;
  if (origin) {
    reply.header('Access-Control-Allow-Origin', origin);
    reply.header('Vary', 'Origin');
  } else {
    reply.header('Access-Control-Allow-Origin', '*');
  }
  reply.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');

  const stream = new PassThrough();
  reply
    .header('Content-Type', 'text/event-stream; charset=utf-8')
    .header('Cache-Control', 'no-cache, no-transform')
    .header('Connection', 'keep-alive')
    .header('X-Accel-Buffering', 'no');

  reply.send(stream);

  const write = (obj) => {
    stream.write(`data: ${JSON.stringify(obj)}\n\n`);
  };

  const end = () => {
    stream.write('data: [DONE]\n\n');
    stream.end();
  };

  return { stream, write, end };
}
