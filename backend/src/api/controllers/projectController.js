/**
 * Contrôleur HTTP : mince couche entre transport Fastify et projectService (Clean Architecture).
 * SSE via PassThrough + reply.send pour compatibilité CORS / navigateurs (évite réponse vide).
 */
import { generateAndPersistProject } from '../../services/projectService.js';
import { projectRepository } from '../../repository/projectRepository.js';
import { createSseReply } from '../utils/sseStream.js';
export const projectController = {
  async generate(request, reply) {
    const { idea, userId, responseLanguage } = request.body ?? {};
    if (!idea || typeof idea !== 'string') {
      return reply.code(400).send({ error: 'Champ "idea" (string) requis' });
    }

    const { write, end } = createSseReply(reply, request);

    try {
      const project = await generateAndPersistProject({
        idea,
        userId: userId ?? undefined,
        responseLanguage,
        onToken: (chunk) => {
          write({ type: 'token', text: chunk });
        },
      });
      write({ type: 'saved', projectId: project.id });
      end();
    } catch (err) {
      request.log.error(err);
      write({ type: 'error', message: err.message ?? 'Erreur génération' });
      end();
    }
  },

  async getById(request, reply) {
    const { id } = request.params;
    const project = await projectRepository.findByIdWithRelations(id);
    if (!project) {
      return reply.code(404).send({ error: 'Projet introuvable' });
    }
    return project;
  },
};
