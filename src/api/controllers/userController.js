import { userRepository } from '../../repository/userRepository.js';

export const userController = {
  async create(request, reply) {
    const { email, name } = request.body ?? {};
    const user = await userRepository.create({
      email: email ?? null,
      name: name ?? null,
    });
    return reply.code(201).send(user);
  },
};
