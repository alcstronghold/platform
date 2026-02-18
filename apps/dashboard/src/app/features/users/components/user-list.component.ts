import type { ManagedUser } from '@alcstronghold/domain';
import { Component, computed, inject, type OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { UserManagementService } from '../../../core/services/user-management.service';

@Component({
  selector: 'app-user-list',
  imports: [RouterLink],
  templateUrl: './user-list.component.html',
})
export class UserListComponent implements OnInit {
  private readonly userManagement = inject(UserManagementService);
  private readonly authService = inject(AuthService);

  protected readonly users = this.userManagement.users;
  protected readonly isLoading = this.userManagement.isLoading;
  protected readonly error = this.userManagement.error;
  protected readonly currentUserId = computed(() => this.authService.user()?.id);

  async ngOnInit(): Promise<void> {
    await this.userManagement.loadUsers();
  }

  protected async toggleStatus(user: ManagedUser): Promise<void> {
    await this.userManagement.toggleUserStatus(user.id);
  }

  protected readonly roleBadgeClass = 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
}
