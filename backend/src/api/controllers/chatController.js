import { streamProjectChat } from '../../services/chatService.js';
import { projectRepository } from '../../repository/projectRepository.js';
import { createSseReply } from '../utils/sseStream.js';
export const chatController = {
  async stream(request, reply) {
    const { projectId } = request.params;
    const { message, responseLanguage } = request.body ?? {};
    if (!message || typeof message !== 'string') {
      return reply.code(400).send({ error: 'Champ "message" (string) requis' });
    }

    const exists = await projectRepository.findByIdWithRelations(projectId);
    if (!exists) {
      return reply.code(404).send({ error: 'Projet introuvable' });
    }

    const { write, end } = createSseReply(reply, request);

    try {
      await streamProjectChat({
        project: exists,
        userMessage: message,
        responseLanguage,
        onChunk: (chunk) => write({ type: 'token', text: chunk }),
      });
      write({ type: 'complete' });
      end();
    } catch (err) {
      request.log.error(err);
      write({ type: 'error', message: err.message ?? 'Erreur chat' });
      end();
    }
  },
};
