import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RESPONSE_LANGUAGES, type ResponseLanguageCode } from '../../constants/response-languages';
import { ApiService, type SsePayload } from '../../services/api.service';

/**
 * « The Void » → métamorphose → redirection vers The Path (projet).
 */
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  idea = '';
  userId = '';
  /** Langue du plan généré (titres, descriptions, tâches). */
  responseLanguage: ResponseLanguageCode = 'fr';
  readonly responseLanguages = RESPONSE_LANGUAGES;
  phase = signal<'void' | 'generating' | 'error'>('void');
  error = signal<string | null>(null);
  apiOk = signal<boolean | null>(null);
  focus = false;
  loadingPhase = signal(0);

  ngOnInit() {
    this.api.getHealth().subscribe({
      next: () => this.apiOk.set(true),
      error: (e: HttpErrorResponse) => {
        this.apiOk.set(false);
        const msg =
          typeof e.error === 'object' && e.error && 'error' in e.error
            ? String((e.error as { error?: string }).error)
            : e.message;
        this.error.set(msg || 'API indisponible');
      },
    });
  }

  toVoid() {
    this.phase.set('void');
    this.error.set(null);
  }

  async submit() {
    this.error.set(null);
    if (!this.idea.trim()) {
      this.error.set('Une idée, même petite, suffit pour commencer.');
      this.phase.set('error');
      return;
    }
    this.phase.set('generating');
    const tick = window.setInterval(() => {
      this.loadingPhase.update((n) => (n + 1) % 2);
    }, 2800);

    try {
      const body: Record<string, unknown> = {
        idea: this.idea.trim(),
        responseLanguage: this.responseLanguage,
      };
      if (this.userId.trim()) body['userId'] = this.userId.trim();
      let projectId: string | null = null;
      await this.api.streamPost('/api/projects/generate', body, (ev: SsePayload) => {
        if (ev.type === 'saved' && 'projectId' in ev) projectId = ev.projectId;
      });
      if (projectId) {
        await this.router.navigate(['/project', projectId]);
        return;
      }
      this.error.set('Réponse incomplète du serveur.');
      this.phase.set('error');
    } catch (e: unknown) {
      this.error.set(e instanceof Error ? e.message : String(e));
      this.phase.set('error');
    } finally {
      clearInterval(tick);
    }
  }
}
