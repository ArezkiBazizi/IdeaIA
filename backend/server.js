/**
 * Point d'entrée production : charge la config (échoue tôt si secrets absents),
 * construit l'application Fastify et écoute sur PORT.
 * Choix Fastify : throughput élevé, schémas de validation natifs, intégration Pino first-class.
 *
 * dotenv : charge `.env` depuis le dossier backend, ou à défaut `.env` à la racine du monorepo.
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envBackend = path.join(__dirname, '.env');
const envRoot = path.join(__dirname, '..', '.env');
if (existsSync(envBackend)) dotenv.config({ path: envBackend });
else if (existsSync(envRoot)) dotenv.config({ path: envRoot });
else dotenv.config();

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
