/**
 * Chargement et validation centralisée des variables d'environnement (Zod).
 * Aucune clé secrète en dur : échec explicite au démarrage si la config est invalide.
 */
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z
    .string()
    .url()
    .refine((u) => u.startsWith('postgres'), 'DATABASE_URL doit pointer vers PostgreSQL'),
  NVIDIA_API_KEY: z.string().min(1, 'NVIDIA_API_KEY est requis'),
  /** Base OpenAI-compatible NVIDIA NIM (Build) */
  NVIDIA_API_BASE_URL: z.string().url().default('https://integrate.api.nvidia.com/v1'),
  /** Modèle NVIDIA Build — surchargeable sans toucher au code */
  NVIDIA_MODEL: z.string().default('nvidia/build-autogen-18'),
  /** Nombre de tentatives HTTP côté client NVIDIA */
  NVIDIA_MAX_RETRIES: z.coerce.number().min(1).max(10).default(3),
});

let cached;

export function loadEnv() {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error('Configuration invalide:', parsed.error.flatten().fieldErrors);
    throw new Error('Variables d\'environnement manquantes ou invalides');
  }
  cached = parsed.data;
  return cached;
}
