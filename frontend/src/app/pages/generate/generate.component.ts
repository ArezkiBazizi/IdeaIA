import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService, type SsePayload } from '../../services/api.service';

@Component({
  selector: 'app-generate',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './generate.component.html',
  styleUrl: './generate.component.scss',
})
export class GenerateComponent {
  private readonly api = inject(ApiService);
  idea = '';
  userId = '';
  streaming = '';
  savedId: string | null = null;
  busy = false;
  error: string | null = null;

  async run() {
    this.error = null;
    this.savedId = null;
    this.streaming = '';
    if (!this.idea.trim()) {
      this.error = 'Décris une idée.';
      return;
    }
    this.busy = true;
    try {
      const body: Record<string, unknown> = { idea: this.idea.trim() };
      if (this.userId.trim()) body['userId'] = this.userId.trim();
      await this.api.streamPost('/api/projects/generate', body, (ev: SsePayload) => {
        if (ev.type === 'token' && 'text' in ev) this.streaming += ev.text;
        if (ev.type === 'saved' && 'projectId' in ev) this.savedId = ev.projectId;
      });
    } catch (e: unknown) {
      this.error = e instanceof Error ? e.message : String(e);
    } finally {
      this.busy = false;
    }
  }
}
