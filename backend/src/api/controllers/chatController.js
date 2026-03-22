import { streamProjectChat } from '../../services/chatService.js';
import { projectRepository } from '../../repository/projectRepository.js';
import { initSse, sseWrite, sseEnd, sseError } from '../utils/sse.js';

export const chatController = {
  async stream(request, reply) {
    const { projectId } = request.params;
    const { message } = request.body ?? {};
    if (!message || typeof message !== 'string') {
      return reply.code(400).send({ error: 'Champ "message" (string) requis' });
    }

    const exists = await projectRepository.findByIdWithRelations(projectId);
    if (!exists) {
      return reply.code(404).send({ error: 'Projet introuvable' });
    }

    initSse(reply, request);

    try {
      await streamProjectChat({
        project: exists,
        userMessage: message,
        onChunk: (chunk) => sseWrite(reply, { type: 'token', text: chunk }),
      });
      sseWrite(reply, { type: 'complete' });
      sseEnd(reply);
    } catch (err) {
      request.log.error(err);
      sseError(reply, request, err.message ?? 'Erreur chat', 500);
    }
  },
};
