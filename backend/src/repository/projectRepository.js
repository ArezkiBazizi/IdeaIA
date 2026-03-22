/**
 * Persistance des projets avec phases et tâches (inclusions typiques pour l'API de lecture).
 */
import { prisma } from '../lib/prisma.js';

export const projectRepository = {
  async createWithPhasesAndTasks({ title, description, userId, phases }) {
    return prisma.project.create({
      data: {
        title,
        description,
        userId: userId ?? undefined,
        phases: {
          create: phases.map((ph, pi) => ({
            title: ph.title,
            orderIndex: pi,
            tasks: {
              create: (ph.tasks ?? []).map((t, ti) => ({
                title: t.title,
                description: t.description ?? '',
                estimatedTime: t.estimatedTime ?? '0',
                orderIndex: ti,
              })),
            },
          })),
        },
      },
      include: {
        phases: { include: { tasks: true } },
      },
    });
  },

  async findByIdWithRelations(id) {
    return prisma.project.findUnique({
      where: { id },
      include: {
        phases: { orderBy: { orderIndex: 'asc' }, include: { tasks: { orderBy: { orderIndex: 'asc' } } } },
        user: true,
      },
    });
  },
};
