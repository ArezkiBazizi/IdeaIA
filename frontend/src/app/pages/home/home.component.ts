import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import type { HealthResponse } from '../../models/project.models';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  private readonly api = inject(ApiService);
  health: HealthResponse | null = null;
  error: string | null = null;
  loading = true;

  ngOnInit() {
    this.api.getHealth().subscribe({
      next: (h) => {
        this.health = h;
        this.loading = false;
      },
      error: (e: HttpErrorResponse) => {
        const msg =
          typeof e.error === 'object' && e.error && 'error' in e.error
            ? String((e.error as { error?: string }).error)
            : e.message;
        this.error = msg || 'Erreur /health';
        this.loading = false;
      },
    });
  }
}
