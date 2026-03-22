/**
 * Agrégation des routes API — point unique d'enregistrement pour garder server.js minimal.
 */
import { projectController } from '../controllers/projectController.js';
import { chatController } from '../controllers/chatController.js';
import { taskController } from '../controllers/taskController.js';
import { userController } from '../controllers/userController.js';
import { healthController } from '../controllers/healthController.js';

export async function registerRoutes(app) {
  app.get('/health', healthController.check);

  app.post('/api/users', userController.create);

  app.post('/api/projects/generate', projectController.generate);
  app.get('/api/projects/:id', projectController.getById);

  app.post('/api/projects/:projectId/chat', chatController.stream);

  app.patch('/api/tasks/:taskId', taskController.updateStatus);
}
