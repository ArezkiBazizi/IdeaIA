/**
 * Point d'entrée production : charge la config (échoue tôt si secrets absents),
 * construit l'application Fastify et écoute sur PORT.
 * Choix Fastify : throughput élevé, schémas de validation natifs, intégration Pino first-class.
 *
 * dotenv : en local, `npm run dev` n'utilise pas Prisma — sans cela, `.env` n'est pas lu par Node.
 */
import 'dotenv/config';
import { loadEnv } from './src/config/env.js';
import { buildApp } from './src/app.js';

async function main() {
  const env = loadEnv();
  const app = await buildApp();

  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
    app.log.info(`Idea-to-Action écoute sur le port ${env.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
