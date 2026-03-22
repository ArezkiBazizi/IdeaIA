/**
 * Cas d'usage « génération de projet » : orchestration prompt → NVIDIA → persistance.
 * Le prompt système force un JSON structuré (Title, Description, Phases/Task/EstimatedTime).
 */
import { projectRepository } from '../repository/projectRepository.js';
import { streamChatCompletion } from './nvidiaService.js';
import { parseProjectPayloadFromText } from './projectPayload.js';
import {
  normalizeResponseLanguage,
  projectGenerationLanguageInstruction,
} from '../utils/responseLanguage.js';

const SYSTEM_PROJECT_JSON = `Tu es un architecte produit senior. Réponds UNIQUEMENT avec un objet JSON valide (sans markdown, sans texte avant ou après) respectant exactement ce schéma :
{
  "title": string,
  "description": string,
  "phases": [
    {
      "title": string,
      "tasks": [
        { "title": string, "description": string, "estimatedTime": string }
      ]
    }
  ]
}
Les clés doivent être en anglais comme ci-dessus. estimatedTime utilise des durées humaines (ex: "2h", "1 jour").`;

export function buildProjectMessages(userIdea, options = {}) {
  const lang = normalizeResponseLanguage(options.responseLanguage);
  const langBlock = projectGenerationLanguageInstruction(lang);
  return [
    {
      role: 'system',
      content: `${SYSTEM_PROJECT_JSON}\n\n${langBlock}`,
    },
    {
      role: 'user',
      content: `Transforme cette idée en plan de projet structuré :\n\n${userIdea}`,
    },
  ];
}

/**
 * Stream : délègue les deltas au callback ; retourne le projet persisté après parsing.
 */
export async function generateAndPersistProject({ idea, userId, onToken, responseLanguage }) {
  const messages = buildProjectMessages(idea, { responseLanguage });
  const fullText = await streamChatCompletion(messages, {
    onChunk: (chunk) => onToken?.(chunk),
  });
  const payload = parseProjectPayloadFromText(fullText);
  const project = await projectRepository.createWithPhasesAndTasks({
    title: payload.title,
    description: payload.description,
    userId,
    phases: payload.phases,
  });
  return project;
}
