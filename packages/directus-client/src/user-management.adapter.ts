import type {
  CreateUserData,
  ManagedUser,
  Policy,
  PolicyAssignment,
  Role,
  UserManagementPort,
} from '@alcstronghold/domain';
import {
  createItem,
  createUser,
  deleteItem,
  readItems,
  readRoles,
  readUsers,
  updateUser,
} from '@directus/sdk';

import type { DirectusAuthClient } from './client.js';

// Tipos de respuesta de Directus
interface DirectusRole {
  id: string;
  name: string;
  admin_access: boolean;
  app_access: boolean;
}

interface DirectusUserWithRole {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar: string | null;
  role: DirectusRole | null;
}

interface DirectusAccess {
  id: string;
  user: string;
  policy: string | DirectusPolicy;
}

interface DirectusPolicy {
  id: string;
  name: string;
  description: string | null;
}

function toRole(r: DirectusRole): Role {
  return {
    id: r.id,
    name: r.name,
    adminAccess: r.admin_access,
    appAccess: r.app_access,
  };
}

function toManagedUser(u: DirectusUserWithRole, assignments: PolicyAssignment[]): ManagedUser {
  return {
    id: u.id,
    email: u.email ?? '',
    firstName: u.first_name,
    lastName: u.last_name,
    avatar: u.avatar,
    role: u.role ? toRole(u.role) : null,
    policyAssignments: assignments,
  };
}

/**
 * Adapter de Directus para gestión de usuarios, roles y policies.
 * Implementa UserManagementPort usando el Directus SDK.
 */
export class DirectusUserManagementAdapter implements UserManagementPort {
  constructor(private readonly client: DirectusAuthClient) {}

  async listUsers(): Promise<ManagedUser[]> {
    const users = await this.client.request<DirectusUserWithRole[]>(
      readUsers({
        fields: ['id', 'email', 'first_name', 'last_name', 'avatar', 'role.id', 'role.name', 'role.admin_access', 'role.app_access'] as any,
      })
    );

    // Obtener todas las asignaciones de policies en batch (evita N+1)
    // Las colecciones del sistema (directus_access, directus_policies) no están
    // tipadas en el schema genérico del SDK, por lo que se requiere cast
    const allAccess = await this.client.request<DirectusAccess[]>(
      (readItems as any)('directus_access', {
        fields: ['id', 'user', 'policy.id', 'policy.name'],
        filter: { user: { _nnull: true } },
      })
    );

    // Agrupar asignaciones por userId
    const assignmentsByUser = new Map<string, PolicyAssignment[]>();
    for (const access of allAccess) {
      const userId = access.user;
      const policy = access.policy as DirectusPolicy;
      if (!userId || !policy?.id) continue;

      const existing = assignmentsByUser.get(userId) ?? [];
      existing.push({
        id: access.id,
        userId,
        policyId: policy.id,
        policyName: policy.name,
      });
      assignmentsByUser.set(userId, existing);
    }

    return users.map(u => toManagedUser(u, assignmentsByUser.get(u.id) ?? []));
  }

  async createUser(data: CreateUserData): Promise<ManagedUser> {
    const created = await this.client.request<DirectusUserWithRole>(
      createUser({
        email: data.email,
        password: data.password,
        first_name: data.firstName,
        last_name: data.lastName,
        role: data.roleId,
      } as any)
    );

    return toManagedUser({ ...created, role: created.role ?? null }, []);
  }

  async updateUserRole(userId: string, roleId: string): Promise<void> {
    await this.client.request(
      updateUser(userId, { role: roleId })
    );
  }

  async listRoles(): Promise<Role[]> {
    const roles = await this.client.request<DirectusRole[]>(
      readRoles({
        fields: ['id', 'name', 'admin_access', 'app_access'] as any,
      })
    );
    return roles.map(toRole);
  }

  async listPolicies(): Promise<Policy[]> {
    const policies = await this.client.request<DirectusPolicy[]>(
      (readItems as any)('directus_policies', {
        fields: ['id', 'name', 'description'],
      })
    );
    return policies.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
    }));
  }

  async getUserPolicyAssignments(userId: string): Promise<PolicyAssignment[]> {
    const access = await this.client.request<DirectusAccess[]>(
      (readItems as any)('directus_access', {
        fields: ['id', 'user', 'policy.id', 'policy.name'],
        filter: { user: { _eq: userId } },
      })
    );

    return access
      .filter(a => {
        const policy = a.policy as DirectusPolicy;
        return policy?.id;
      })
      .map(a => {
        const policy = a.policy as DirectusPolicy;
        return {
          id: a.id,
          userId,
          policyId: policy.id,
          policyName: policy.name,
        };
      });
  }

  async assignPolicy(userId: string, policyId: string): Promise<PolicyAssignment> {
    const result = await this.client.request<DirectusAccess>(
      (createItem as any)('directus_access', { user: userId, policy: policyId })
    );

    return {
      id: result.id,
      userId,
      policyId,
      policyName: '',
    };
  }

  async removePolicy(assignmentId: string): Promise<void> {
    await this.client.request(
      (deleteItem as any)('directus_access', assignmentId)
    );
  }
}
