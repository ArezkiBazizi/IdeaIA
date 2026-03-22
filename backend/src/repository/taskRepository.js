/**
 * Mise à jour atomique du statut des tâches (validation d'étape).
 */
import { prisma } from '../lib/prisma.js';

export const taskRepository = {
  async updateStatus(taskId, status) {
    return prisma.task.update({
      where: { id: taskId },
      data: { status },
      include: { phase: { include: { project: true } } },
    });
  },

  async findById(taskId) {
    return prisma.task.findUnique({
      where: { id: taskId },
      include: { phase: { include: { project: true } } },
    });
  },
};
