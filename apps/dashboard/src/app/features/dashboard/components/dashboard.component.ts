import { NgOptimizedImage } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  imports: [NgOptimizedImage, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly user = computed(() => this.authService.user());
  protected readonly isAdmin = computed(() => this.authService.user()?.role?.adminAccess === true);

  protected async onLogout(): Promise<void> {
    await this.authService.logout();
    await this.router.navigate(['/login'], {
      queryParams: {},
      queryParamsHandling: '',
    });
  }
}