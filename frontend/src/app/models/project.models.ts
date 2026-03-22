export interface Task {
  id: string;
  title: string;
  description: string;
  estimatedTime: string;
  status: string;
  orderIndex: number;
}

export interface Phase {
  id: string;
  title: string;
  orderIndex: number;
  tasks: Task[];
}

export interface Project {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  userId: string | null;
  phases: Phase[];
}

export interface HealthResponse {
  status: string;
  service: string;
  database: string;
  timestamp: string;
}
