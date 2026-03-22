/**
 * Contrôleur HTTP : mince couche entre transport Fastify et projectService (Clean Architecture).
 */
import { generateAndPersistProject } from '../../services/projectService.js';
import { projectRepository } from '../../repository/projectRepository.js';
import { initSse, sseWrite, sseEnd, sseError } from '../utils/sse.js';

export const projectController = {
  async generate(request, reply) {
    const { idea, userId } = request.body ?? {};
    if (!idea || typeof idea !== 'string') {
      return reply.code(400).send({ error: 'Champ "idea" (string) requis' });
    }

    initSse(reply, request);

    try {
      const project = await generateAndPersistProject({
        idea,
        userId: userId ?? undefined,
        onToken: (chunk) => {
          sseWrite(reply, { type: 'token', text: chunk });
        },
      });
      sseWrite(reply, { type: 'saved', projectId: project.id });
      sseEnd(reply);
    } catch (err) {
      request.log.error(err);
      sseError(reply, request, err.message ?? 'Erreur génération', 500);
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
