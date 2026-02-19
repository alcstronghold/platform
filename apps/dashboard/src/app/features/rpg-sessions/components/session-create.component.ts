import type { CreateRpgSessionData } from '@alcstronghold/domain';
import { Component, inject, type OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { CatalogService } from '../../../core/services/catalog.service';
import { RpgSessionService } from '../../../core/services/rpg-session.service';
import { SessionFormComponent } from './session-form.component';

@Component({
  selector: 'app-session-create',
  imports: [SessionFormComponent],
  templateUrl: './session-create.component.html',
})
export class SessionCreateComponent implements OnInit {
  private readonly catalogService = inject(CatalogService);
  private readonly rpgSessionService = inject(RpgSessionService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly catalog = this.catalogService;
  protected readonly isSubmitting = signal(false);
  protected readonly serverError = signal<string | null>(null);
  protected readonly isLoadingCatalog = this.catalogService.isLoading;

  async ngOnInit(): Promise<void> {
    await this.catalogService.loadAll();
  }

  async onSubmit(data: CreateRpgSessionData): Promise<void> {
    const currentUser = this.authService.user();
    if (!currentUser) return;

    this.isSubmitting.set(true);
    this.serverError.set(null);

    const result = await this.rpgSessionService.createSession(currentUser.id, data);

    if (result.success) {
      await this.router.navigate(['/rpg-sessions']);
    } else {
      this.serverError.set(result.error ?? 'Error al crear la sesión');
    }

    this.isSubmitting.set(false);
  }

  onCancel(): void {
    this.router.navigate(['/rpg-sessions']);
  }
}
