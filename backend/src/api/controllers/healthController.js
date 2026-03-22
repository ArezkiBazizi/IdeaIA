import { prisma } from '../../lib/prisma.js';

export const healthController = {
  async check(_request, reply) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return reply.send({
        status: 'ok',
        service: 'idea-to-action',
        database: 'up',
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      reply.log.error(err);
      return reply.code(503).send({
        status: 'degraded',
        database: 'down',
        timestamp: new Date().toISOString(),
      });
    }
  },
};
