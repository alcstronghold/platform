import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../services/auth.service';
import { PermissionService } from '../services/permission.service';
import { ThemeService } from '../services/theme.service';

@Component({
  selector: 'app-layout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app-layout.component.html',
})
export class AppLayoutComponent {
  private readonly authService = inject(AuthService);
  private readonly permissions = inject(PermissionService);
  private readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);

  protected readonly user = computed(() => this.authService.user());
  protected readonly isAdmin = this.permissions.isAdmin;
  protected readonly canAccessSessions = this.permissions.canAccessSessions;
  protected readonly isDark = this.themeService.isDark;

  protected toggleTheme(): void {
    this.themeService.toggle();
  }

  protected async onLogout(): Promise<void> {
    await this.authService.logout();
    await this.router.navigate(['/login']);
  }
}
