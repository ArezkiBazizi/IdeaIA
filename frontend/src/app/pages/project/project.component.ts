import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import type { Project, Task } from '../../models/project.models';
import { ApiService, type SsePayload } from '../../services/api.service';

const STATUSES = ['PENDING', 'IN_PROGRESS', 'DONE', 'SKIPPED'] as const;

@Component({
  selector: 'app-project',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './project.component.html',
  styleUrl: './project.component.scss',
})
export class ProjectComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);

  project: Project | null = null;
  loadError: string | null = null;
  chatMessage = '';
  chatStream = '';
  chatBusy = false;
  chatError: string | null = null;
  taskBusy: Record<string, boolean> = {};

  readonly statuses = STATUSES;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loadError = 'ID manquant';
      return;
    }
    this.api.getProject(id).subscribe({
      next: (p) => (this.project = p),
      error: (e: Error) => (this.loadError = e.message ?? 'Projet introuvable'),
    });
  }

  async sendChat() {
    const id = this.project?.id;
    if (!id || !this.chatMessage.trim()) return;
    this.chatError = null;
    this.chatStream = '';
    this.chatBusy = true;
    try {
      await this.api.streamPost(
        `/api/projects/${encodeURIComponent(id)}/chat`,
        { message: this.chatMessage.trim() },
        (ev: SsePayload) => {
          if (ev.type === 'token' && 'text' in ev) this.chatStream += ev.text;
        },
      );
    } catch (e: unknown) {
      this.chatError = e instanceof Error ? e.message : String(e);
    } finally {
      this.chatBusy = false;
    }
  }

  setTaskStatus(task: Task, status: string) {
    this.taskBusy[task.id] = true;
    this.api.patchTask(task.id, status).subscribe({
      next: () => {
        task.status = status;
        this.taskBusy[task.id] = false;
      },
      error: (e: Error) => {
        this.taskBusy[task.id] = false;
        alert(e.message);
      },
    });
  }
}
