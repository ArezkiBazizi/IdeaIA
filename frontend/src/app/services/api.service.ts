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
    if (res.status === 204 || res.status === 205) {
      throw new Error(
        `Réponse HTTP ${res.status} (sans corps) — vérifie que l’API tourne sur ${this.base} et que la route POST /api/projects/generate renvoie bien un flux SSE (pas une requête OPTIONS confondue avec le POST dans l’onglet Réseau).`,
      );
    }
    const reader = res.body?.getReader();
    if (!reader) {
      throw new Error(
        `Réponse sans corps lisible (HTTP ${res.status}). Souvent une requête OPTIONS (prévol) affiche 204 : sélectionne bien la ligne POST dans l’onglet Réseau.`,
      );
    }
    const decoder = new TextDecoder();
    let buffer = '';

    const parseLine = (line: string): boolean => {
      const trimmed = line.replace(/\r$/, '').trim();
      if (!trimmed.startsWith('data:')) return false;
      const raw = trimmed.replace(/^data:\s*/, '').trim();
      if (raw === '[DONE]') return true;
      let payload: SsePayload;
      try {
        payload = JSON.parse(raw) as SsePayload;
      } catch {
        return false;
      }
      if (payload.type === 'error') {
        const msg = 'message' in payload ? String(payload.message) : 'Erreur serveur';
        throw new Error(msg);
      }
      onEvent(payload);
      return false;
    };

    for (;;) {
      const { done, value } = await reader.read();
      if (value) buffer += decoder.decode(value, { stream: true });
      if (!done) {
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (parseLine(line)) return;
        }
      } else {
        const lines = buffer.split(/\r?\n/);
        for (const line of lines) {
          if (parseLine(line)) return;
        }
        return;
      }
    }
  }
}

export type SsePayload =
  | { type: 'token'; text: string }
  | { type: 'saved'; projectId: string }
  | { type: 'complete' }
  | { type: 'error'; message: string };
