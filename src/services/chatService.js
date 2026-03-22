/**
 * Chat contextuel « RAG simplifié » : le contexte projet est injecté dans le message système
 * (pas d'embeddings — suffisant pour un MVP premium et prévisible).
 */
import { streamChatCompletion } from './nvidiaService.js';

function projectToContextBlock(project) {
  const lines = [
    `Titre: ${project.title}`,
    `Description: ${project.description}`,
    '',
    'Phases et tâches:',
  ];
  for (const ph of project.phases ?? []) {
    lines.push(`- Phase: ${ph.title}`);
    for (const t of ph.tasks ?? []) {
      lines.push(`  * [${t.status}] ${t.title} (${t.estimatedTime}) — ${t.description}`);
    }
  }
  return lines.join('\n');
}

const CHAT_SYSTEM = `Tu es un coach de mise en œuvre pour le projet décrit ci-dessous. Réponds de façon concise et actionnable. Tu peux proposer des sous-tâches ou clarifier les risques.`;

/** @param {object} project — enregistrement Prisma avec phases et tâches (chargé en amont). */
export async function streamProjectChat({ project, userMessage, onChunk }) {
  const context = projectToContextBlock(project);
  const messages = [
    {
      role: 'system',
      content: `${CHAT_SYSTEM}\n\n--- Contexte projet ---\n${context}`,
    },
    { role: 'user', content: userMessage },
  ];

  return streamChatCompletion(messages, { onChunk });
}
