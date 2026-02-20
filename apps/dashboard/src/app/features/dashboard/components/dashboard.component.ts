import { NgOptimizedImage } from '@angular/common';
import { Component, computed, inject } from '@angular/core';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  imports: [NgOptimizedImage],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  private readonly authService = inject(AuthService);

  protected readonly user = computed(() => this.authService.user());
}
