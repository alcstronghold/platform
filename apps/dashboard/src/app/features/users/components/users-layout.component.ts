import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-users-layout',
  imports: [RouterOutlet, RouterLink],
  templateUrl: './users-layout.component.html',
})
export class UsersLayoutComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly displayName = computed(() => this.authService.user()?.displayName ?? '');

  protected async onLogout(): Promise<void> {
    await this.authService.logout();
    await this.router.navigate(['/login']);
  }
}
