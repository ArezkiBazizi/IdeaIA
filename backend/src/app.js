/**
 * Composition racine Fastify : plugins transverses (CORS, logging Pino) et enregistrement des routes.
 * Séparation app / server.js pour permettre les tests d'intégration sans écouter le port.
 */
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { loadEnv } from './config/env.js';
import { registerRoutes } from './api/routes/index.js';

export async function buildApp() {
  const env = loadEnv();

  const app = Fastify({
    logger: {
      level: env.NODE_ENV === 'production' ? 'info' : 'debug',
      ...(env.NODE_ENV === 'development' && {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'HH:MM:ss Z' },
        },
      }),
    },
    requestIdHeader: 'x-request-id',
    genReqId: () => crypto.randomUUID(),
  });

  await app.register(cors, { origin: true });

  /** Hook léger : corrélation logs / observabilité (complète les logs structurés Pino). */
  app.addHook('onRequest', async (request) => {
    request.log = request.log.child({ path: request.url, method: request.method });
  });

  await registerRoutes(app);

  app.setErrorHandler((error, request, reply) => {
    request.log.error(error);
    const status = error.statusCode ?? 500;
    reply.status(status).send({
      error: error.message ?? 'Erreur interne',
      requestId: request.id,
    });
  });

  return app;
}
