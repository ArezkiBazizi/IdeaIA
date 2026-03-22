/**
 * Utilitaires SSE : évite la duplication et garantit des en-têtes cohérents pour le streaming.
 * X-Accel-Buffering: no — utile derrière Nginx pour ne pas bufferiser le flux.
 *
 * CORS : reply.hijack() contourne @fastify/cors — il faut renvoyer les en-têtes CORS sur raw.
 */
function corsForRequest(request) {
  const origin = request.headers.origin;
  const allow = origin && origin !== '' ? origin : '*';
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
    ...(allow !== '*' && { Vary: 'Origin' }),
  };
}

export function initSse(reply, request) {
  reply.hijack();
  reply.raw.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
    ...corsForRequest(request),
  });
}

export function sseWrite(reply, payload) {
  reply.raw.write(`data: ${JSON.stringify(payload)}\n\n`);
}

export function sseEnd(reply) {
  reply.raw.write('data: [DONE]\n\n');
  reply.raw.end();
}

export function sseError(reply, request, message, statusCode = 500) {
  if (!reply.raw.headersSent) {
    reply.hijack();
    reply.raw.writeHead(statusCode, {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsForRequest(request),
    });
    reply.raw.end(JSON.stringify({ error: message }));
    return;
  }
  sseWrite(reply, { type: 'error', message });
  sseEnd(reply);
}
