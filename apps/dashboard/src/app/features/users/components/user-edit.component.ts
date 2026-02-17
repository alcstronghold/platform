import type { ManagedUser, Policy } from '@alcstronghold/domain';
import { Component, computed, inject, type OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { UserManagementService } from '../../../core/services/user-management.service';

@Component({
  selector: 'app-user-edit',
  imports: [RouterLink],
  templateUrl: './user-edit.component.html',
})
export class UserEditComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly userManagement = inject(UserManagementService);

  readonly roles = this.userManagement.roles;
  readonly policies = this.userManagement.policies;
  readonly isSaving = signal(false);
  readonly error = signal<string | null>(null);

  readonly user = computed<ManagedUser | undefined>(() => {
    const userId = this.route.snapshot.paramMap.get('id');
    return this.userManagement.users().find(u => u.id === userId);
  });

  readonly assignedPolicyIds = computed(() => {
    const user = this.user();
    return new Set(user?.policyAssignments.map(pa => pa.policyId) ?? []);
  });

  async ngOnInit(): Promise<void> {
    await Promise.all([
      this.userManagement.loadUsers(),
      this.userManagement.loadRoles(),
      this.userManagement.loadPolicies(),
    ]);
  }

  async onRoleChange(event: Event): Promise<void> {
    const select = event.target as HTMLSelectElement;
    const user = this.user();
    if (!user) return;

    this.isSaving.set(true);
    this.error.set(null);

    try {
      await this.userManagement.updateUserRole(user.id, select.value);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Error al cambiar rol');
    }

    this.isSaving.set(false);
  }

  async togglePolicy(policy: Policy): Promise<void> {
    const user = this.user();
    if (!user) return;

    this.isSaving.set(true);
    this.error.set(null);

    try {
      const existing = user.policyAssignments.find(pa => pa.policyId === policy.id);
      if (existing) {
        await this.userManagement.removePolicy(existing.id);
      } else {
        await this.userManagement.assignPolicy(user.id, policy.id);
      }
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Error al modificar policy');
    }

    this.isSaving.set(false);
  }

  isPolicyAssigned(policyId: string): boolean {
    return this.assignedPolicyIds().has(policyId);
  }
}
