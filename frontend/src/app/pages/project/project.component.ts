import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { RESPONSE_LANGUAGES, type ResponseLanguageCode } from '../../constants/response-languages';
import type { Project, Task } from '../../models/project.models';
import { ApiService, type SsePayload } from '../../services/api.service';

@Component({
  selector: 'app-project',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './project.component.html',
  styleUrl: './project.component.scss',
})
export class ProjectComponent implements OnInit, OnDestroy {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);

  project = signal<Project | null>(null);
  loadError = signal<string | null>(null);
  chatMessage = '';
  chatStream = '';
  /** Langue des réponses du co-pilot. */
  responseLanguage: ResponseLanguageCode = 'fr';
  readonly responseLanguages = RESPONSE_LANGUAGES;
  chatBusy = false;
  chatError: string | null = null;
  taskBusy: Record<string, boolean> = {};

  /** Co-pilot : suggestion après 30 s d’inactivité */
  copilotOpen = signal(false);
  copilotHint = signal(false);
  private lastActivity = Date.now();
  private idleCheck?: number;

  /** Micro-confettis après validation */
  confettiFor = signal<string | null>(null);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loadError.set('ID manquant');
      return;
    }
    this.api.getProject(id).subscribe({
      next: (p) => this.project.set(p),
      error: (e: HttpErrorResponse) => {
        const msg =
          typeof e.error === 'object' && e.error && 'error' in e.error
            ? String((e.error as { error?: string }).error)
            : e.message;
        this.loadError.set(msg);
      },
    });

    this.idleCheck = window.setInterval(() => {
      const idle = Date.now() - this.lastActivity > 30000;
      this.copilotHint.set(idle && !this.copilotOpen());
    }, 1000);
  }

  ngOnDestroy() {
    if (this.idleCheck) clearInterval(this.idleCheck);
  }

  @HostListener('document:mousemove')
  @HostListener('document:keydown')
  @HostListener('document:click')
  @HostListener('window:scroll')
  touchActivity() {
    this.lastActivity = Date.now();
    this.copilotHint.set(false);
  }

  progress(): number {
    const p = this.project();
    if (!p?.phases?.length) return 0;
    let total = 0;
    let done = 0;
    for (const ph of p.phases) {
      for (const t of ph.tasks) {
        total++;
        if (t.status === 'DONE') done++;
      }
    }
    return total === 0 ? 0 : Math.round((done / total) * 100);
  }

  toggleCopilot() {
    this.copilotOpen.update((v) => !v);
    if (this.copilotOpen()) this.copilotHint.set(false);
  }

  async sendChat() {
    const p = this.project();
    if (!p?.id || !this.chatMessage.trim()) return;
    this.chatError = null;
    this.chatStream = '';
    this.chatBusy = true;
    try {
      await this.api.streamPost(
        `/api/projects/${encodeURIComponent(p.id)}/chat`,
        { message: this.chatMessage.trim(), responseLanguage: this.responseLanguage },
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

  /** Checkbox principale : passage à DONE avec feedback haptique + confettis */
  onToggleTask(task: Task) {
    if (this.taskBusy[task.id]) return;
    const next = task.status === 'DONE' ? 'PENDING' : 'DONE';
    if (next === 'DONE') {
      this.burstFeedback(task.id);
    }
    this.applyStatus(task, next);
  }

  private burstFeedback(taskId: string) {
    this.confettiFor.set(taskId);
    window.setTimeout(() => this.confettiFor.set(null), 1400);
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([12, 40, 12]);
    }
  }

  private applyStatus(task: Task, status: string) {
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
