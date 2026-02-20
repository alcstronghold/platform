import type { CreateRpgSessionData } from '@alcstronghold/domain';
import { Component, inject, type OnInit, signal, viewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { CatalogService } from '../../../core/services/catalog.service';
import { RpgSessionService } from '../../../core/services/rpg-session.service';
import { SessionFormComponent } from './session-form.component';

@Component({
  selector: 'app-session-edit',
  imports: [SessionFormComponent],
  templateUrl: './session-edit.component.html',
})
export class SessionEditComponent implements OnInit {
  private readonly catalogService = inject(CatalogService);
  private readonly rpgSessionService = inject(RpgSessionService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly catalog = this.catalogService;
  protected readonly session = this.rpgSessionService.currentSession;
  protected readonly isLoading = signal(true);
  protected readonly isSubmitting = signal(false);
  protected readonly serverError = signal<string | null>(null);

  private readonly formComponent = viewChild(SessionFormComponent);
  private sessionId = '';

  async ngOnInit(): Promise<void> {
    this.sessionId = this.route.snapshot.paramMap.get('id') ?? '';

    // Cargar catálogo y sesión en paralelo
    await Promise.all([
      this.catalogService.loadAll(),
      this.rpgSessionService.loadSession(this.sessionId),
    ]);

    // Inicializar el formulario con los datos de la sesión
    const session = this.rpgSessionService.currentSession();
    if (session) {
      this.formComponent()?.loadData(session);
    }

    this.isLoading.set(false);
  }

  async onSubmit(data: CreateRpgSessionData): Promise<void> {
    this.isSubmitting.set(true);
    this.serverError.set(null);

    const result = await this.rpgSessionService.updateSession({
      ...data,
      id: this.sessionId,
    });

    if (result.success) {
      await this.router.navigate(['/rpg-sessions']);
    } else {
      this.serverError.set(result.error ?? 'Error al actualizar la sesión');
    }

    this.isSubmitting.set(false);
  }

  onCancel(): void {
    this.router.navigate(['/rpg-sessions']);
  }
}
