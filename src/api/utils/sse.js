/**
 * Utilitaires SSE : évite la duplication et garantit des en-têtes cohérents pour le streaming.
 * X-Accel-Buffering: no — utile derrière Nginx pour ne pas bufferiser le flux.
 */
export function initSse(reply) {
  reply.hijack();
  reply.raw.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
}

export function sseWrite(reply, payload) {
  reply.raw.write(`data: ${JSON.stringify(payload)}\n\n`);
}

export function sseEnd(reply) {
  reply.raw.write('data: [DONE]\n\n');
  reply.raw.end();
}

export function sseError(reply, message, statusCode = 500) {
  if (!reply.raw.headersSent) {
    reply.hijack();
    reply.raw.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
    reply.raw.end(JSON.stringify({ error: message }));
    return;
  }
  sseWrite(reply, { type: 'error', message });
  sseEnd(reply);
}
