import type { CreateUserData, ManagedUser, Policy, Role, UserManagementPort } from '@alcstronghold/domain';
import { CreateUserUseCase, type CreateUserResult } from '@alcstronghold/domain';
import { computed, inject, Injectable, signal } from '@angular/core';

import { USER_MANAGEMENT_PORT } from '../providers/directus.provider';

interface UserManagementState {
  users: ManagedUser[];
  roles: Role[];
  policies: Policy[];
  isLoading: boolean;
  error: string | null;
}

@Injectable({ providedIn: 'root' })
export class UserManagementService {
  private readonly port = inject(USER_MANAGEMENT_PORT);

  private readonly state = signal<UserManagementState>({
    users: [],
    roles: [],
    policies: [],
    isLoading: false,
    error: null,
  });

  readonly users = computed(() => this.state().users);
  readonly roles = computed(() => this.state().roles);
  readonly policies = computed(() => this.state().policies);
  readonly isLoading = computed(() => this.state().isLoading);
  readonly error = computed(() => this.state().error);

  async loadUsers(): Promise<void> {
    this.patchState({ isLoading: true, error: null });
    try {
      const users = await this.port.listUsers();
      this.patchState({ users, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al cargar usuarios';
      this.patchState({ isLoading: false, error: message });
    }
  }

  async loadRoles(): Promise<void> {
    try {
      const roles = await this.port.listRoles();
      this.patchState({ roles });
    } catch {
      // Los roles son necesarios pero no bloqueantes
    }
  }

  async loadPolicies(): Promise<void> {
    try {
      const policies = await this.port.listPolicies();
      this.patchState({ policies });
    } catch {
      // Las policies son necesarias pero no bloqueantes
    }
  }

  async createUser(data: CreateUserData): Promise<CreateUserResult> {
    const useCase = new CreateUserUseCase(this.port);
    const result = await useCase.execute(data);

    if (result.success) {
      await this.loadUsers();
    }

    return result;
  }

  async updateUserRole(userId: string, roleId: string): Promise<void> {
    await this.port.updateUserRole(userId, roleId);
    await this.loadUsers();
  }

  async assignPolicy(userId: string, policyId: string): Promise<void> {
    await this.port.assignPolicy(userId, policyId);
    await this.loadUsers();
  }

  async removePolicy(assignmentId: string): Promise<void> {
    await this.port.removePolicy(assignmentId);
    await this.loadUsers();
  }

  private patchState(patch: Partial<UserManagementState>): void {
    this.state.update(current => ({ ...current, ...patch }));
  }
}
