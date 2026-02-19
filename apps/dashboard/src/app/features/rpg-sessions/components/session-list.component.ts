import { Component, computed, inject, type OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { PermissionService } from '../../../core/services/permission.service';
import { RpgSessionService } from '../../../core/services/rpg-session.service';

@Component({
  selector: 'app-session-list',
  imports: [RouterLink],
  templateUrl: './session-list.component.html',
})
export class SessionListComponent implements OnInit {
  private readonly rpgSessionService = inject(RpgSessionService);
  private readonly authService = inject(AuthService);
  private readonly permissions = inject(PermissionService);

  protected readonly sessions = this.rpgSessionService.sessions;
  protected readonly isLoading = this.rpgSessionService.isLoading;
  protected readonly error = this.rpgSessionService.error;

  /** Admin y Comisión ven todas las sesiones con columna Master */
  protected readonly showMasterColumn = this.permissions.canViewAllSessions;
  protected readonly canCreateSession = this.permissions.canCreateSessions;

  protected readonly currentUserId = computed(() => this.authService.user()?.id);

  async ngOnInit(): Promise<void> {
    const canViewAll = this.permissions.canViewAllSessions();
    const currentUser = this.authService.user();

    if (canViewAll) {
      await this.rpgSessionService.loadSessions();
    } else if (currentUser) {
      await this.rpgSessionService.loadSessions({ masterId: currentUser.id });
    }
  }

  protected async onDelete(sessionId: string): Promise<void> {
    await this.rpgSessionService.deleteSession(sessionId);
  }

  protected statusLabel(status: string): string {
    switch (status) {
      case 'published': return 'Publicada';
      case 'archived': return 'Archivada';
      default: return 'Borrador';
    }
  }

  protected statusBadgeClass(status: string): string {
    switch (status) {
      case 'published': return 'badge-green';
      case 'archived': return 'badge-gray';
      default: return 'badge-yellow';
    }
  }
}
