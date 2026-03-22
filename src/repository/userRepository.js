/**
 * Repository Pattern : encapsule Prisma pour User — une seule responsabilité (persistance).
 */
import { prisma } from '../lib/prisma.js';

export const userRepository = {
  async create(data) {
    return prisma.user.create({ data });
  },

  async findById(id) {
    return prisma.user.findUnique({ where: { id } });
  },
};
