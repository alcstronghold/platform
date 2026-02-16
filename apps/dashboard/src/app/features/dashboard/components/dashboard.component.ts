import { NgOptimizedImage } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  imports: [NgOptimizedImage],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly user = computed(() => this.authService.user());

  protected async onLogout(): Promise<void> {
    await this.authService.logout();
    await this.router.navigate(['/login'], {
      queryParams: {},
      queryParamsHandling: '',
    });
  }
}