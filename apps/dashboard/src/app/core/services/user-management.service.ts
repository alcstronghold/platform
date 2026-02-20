import type { ManagedUser, Policy, Role, UserManagementPort } from '@alcstronghold/domain';
import { CreateUserUseCase, type CreateUserResult } from '@alcstronghold/domain';
import { computed, inject, Injectable, signal } from '@angular/core';

import { USER_MANAGEMENT_PORT } from '../providers/directus.provider';

/** Datos del formulario de creación (sin roleId, se asigna automáticamente) */
export interface CreateUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

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

  async createUser(input: CreateUserInput): Promise<CreateUserResult> {
    let roleId: string;
    try {
      roleId = await this.resolveUserRoleId();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error al resolver el rol';
      return { success: false, error: message };
    }

    const useCase = new CreateUserUseCase(this.port);
    const result = await useCase.execute({ ...input, roleId });

    if (result.success) {
      await this.loadUsers();
    }

    return result;
  }

  async assignPolicy(userId: string, policyId: string): Promise<void> {
    await this.port.assignPolicy(userId, policyId);
    await this.loadUsers();
  }

  /** Asigna múltiples policies a un usuario y recarga la lista una sola vez */
  async assignPolicies(userId: string, policyIds: string[]): Promise<void> {
    await Promise.all(policyIds.map(id => this.port.assignPolicy(userId, id)));
    if (policyIds.length > 0) {
      await this.loadUsers();
    }
  }

  async removePolicy(assignmentId: string): Promise<void> {
    await this.port.removePolicy(assignmentId);
    await this.loadUsers();
  }

  /** Alterna el status de un usuario entre active y suspended */
  async toggleUserStatus(userId: string): Promise<void> {
    const user = this.users().find(u => u.id === userId);
    if (!user) return;

    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    await this.port.updateUserStatus(userId, newStatus);
    await this.loadUsers();
  }

  /** Resuelve el ID del rol "User" consultando Directus */
  private async resolveUserRoleId(): Promise<string> {
    const roles = await this.port.listRoles();
    const userRole = roles.find(r => r.name === 'User');

    if (!userRole) {
      throw new Error('Rol "User" no encontrado en Directus');
    }

    return userRole.id;
  }

  private patchState(patch: Partial<UserManagementState>): void {
    this.state.update(current => ({ ...current, ...patch }));
  }
}
