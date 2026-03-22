import { taskRepository } from '../../repository/taskRepository.js';

const ALLOWED = new Set(['PENDING', 'IN_PROGRESS', 'DONE', 'SKIPPED']);

export const taskController = {
  async updateStatus(request, reply) {
    const { taskId } = request.params;
    const { status } = request.body ?? {};
    if (!status || !ALLOWED.has(status)) {
      return reply.code(400).send({
        error: 'Statut invalide',
        allowed: [...ALLOWED],
      });
    }

    const existing = await taskRepository.findById(taskId);
    if (!existing) {
      return reply.code(404).send({ error: 'Tâche introuvable' });
    }

    const updated = await taskRepository.updateStatus(taskId, status);
    return {
      id: updated.id,
      status: updated.status,
      phaseId: updated.phaseId,
      projectId: updated.phase.projectId,
    };
  },
};
