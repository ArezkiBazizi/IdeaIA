import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import type { HealthResponse, Project } from '../models/project.models';

/**
 * Client HTTP + streaming SSE (POST) pour les routes NVIDIA qui renvoient du text/event-stream.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  getHealth() {
    return this.http.get<HealthResponse>(`${this.base}/health`);
  }

  getProject(id: string) {
    return this.http.get<Project>(`${this.base}/api/projects/${encodeURIComponent(id)}`);
  }

  createUser(body: { email?: string | null; name?: string | null }) {
    return this.http.post(`${this.base}/api/users`, body);
  }

  patchTask(taskId: string, status: string) {
    return this.http.patch<{ id: string; status: string; phaseId: string; projectId: string }>(
      `${this.base}/api/tasks/${encodeURIComponent(taskId)}`,
      { status },
    );
  }

  /**
   * Lit un flux SSE (lignes `data: ...`) renvoyé par un POST.
   */
  async streamPost(
    path: string,
    body: Record<string, unknown>,
    onEvent: (payload: SsePayload) => void,
  ): Promise<void> {
    const res = await fetch(`${this.base}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      let msg = text || res.statusText;
      try {
        const j = JSON.parse(text) as { error?: string };
        if (j?.error) msg = j.error;
      } catch {
        /* garder texte brut */
      }
      throw new Error(msg);
    }
    const reader = res.body?.getReader();
    if (!reader) throw new Error('Réponse sans corps');
    const decoder = new TextDecoder();
    let buffer = '';
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        const raw = line.replace(/^data:\s*/, '').trim();
        if (raw === '[DONE]') return;
        try {
          onEvent(JSON.parse(raw) as SsePayload);
        } catch {
          /* ligne partielle */
        }
      }
    }
  }
}

export type SsePayload =
  | { type: 'token'; text: string }
  | { type: 'saved'; projectId: string }
  | { type: 'complete' }
  | { type: 'error'; message: string };
