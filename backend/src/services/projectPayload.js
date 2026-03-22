/**
 * Schéma Zod aligné sur le JSON imposé par le prompt système NVIDIA (contrat API stable).
 */
import { z } from 'zod';

const str = z.preprocess((v) => (v == null || v === '' ? '' : String(v)), z.string());

export const projectPayloadSchema = z.object({
  title: z.preprocess((v) => String(v ?? '').trim(), z.string().min(1)),
  description: str,
  phases: z.array(
    z.object({
      title: z.preprocess((v) => String(v ?? '').trim(), z.string().min(1)),
      tasks: z
        .array(
          z.object({
            title: z.preprocess((v) => String(v ?? '').trim(), z.string().min(1)),
            description: str.default(''),
            estimatedTime: str.default('—'),
          }),
        )
        .default([]),
    }),
  ),
});

/**
 * Extraction robuste : le modèle peut entourer le JSON de markdown ou de prose.
 */
export function parseProjectPayloadFromText(text) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : trimmed;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('Impossible de localiser un objet JSON dans la réponse du modèle');
  }
  const jsonStr = candidate.slice(start, end + 1);
  const raw = JSON.parse(jsonStr);
  return projectPayloadSchema.parse(raw);
}
