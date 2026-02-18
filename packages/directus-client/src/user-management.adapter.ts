import type {
  CreateUserData,
  ManagedUser,
  Policy,
  PolicyAssignment,
  Role,
  UserManagementPort,
  UserStatus,
} from '@alcstronghold/domain';
import {
  createUser,
  customEndpoint,
  readPolicies,
  readRoles,
  readUsers,
  updateUser,
} from '@directus/sdk';

import type { DirectusAuthClient } from './client.js';

// Tipos de respuesta de Directus
// Nota: En Directus 11, admin_access y app_access no existen en directus_roles;
// el acceso se gestiona mediante políticas (policies).
interface DirectusRole {
  id: string;
  name: string;
}

interface DirectusUserWithRole {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar: string | null;
  status: string | null;
  role: DirectusRole | null;
}

interface DirectusAccessItem {
  id: string;
  user: string;
  policy: string | DirectusPolicyItem;
}

interface DirectusPolicyItem {
  id: string;
  name: string;
  description: string | null;
}

function toRole(r: DirectusRole): Role {
  return { id: r.id, name: r.name };
}

function extractPolicyId(policy: string | DirectusPolicyItem): string {
  return typeof policy === 'string' ? policy : policy.id;
}

function extractPolicyName(policy: string | DirectusPolicyItem): string {
  return typeof policy === 'string' ? '' : (policy.name ?? '');
}

function parseUserStatus(status: string | null): UserStatus {
  return status === 'suspended' ? 'suspended' : 'active';
}

function toManagedUser(u: DirectusUserWithRole, assignments: PolicyAssignment[]): ManagedUser {
  return {
    id: u.id,
    email: u.email ?? '',
    firstName: u.first_name,
    lastName: u.last_name,
    avatar: u.avatar,
    status: parseUserStatus(u.status),
    role: u.role ? toRole(u.role) : null,
    policyAssignments: assignments,
  };
}

/**
 * Adapter de Directus para gestión de usuarios, roles y policies.
 * Implementa UserManagementPort usando el Directus SDK.
 *
 * Notas sobre colecciones del sistema en Directus 11:
 * - directus_policies: usa readPolicies() del SDK
 * - directus_access: usa customEndpoint() ya que el SDK no tiene funciones dedicadas
 */
export class DirectusUserManagementAdapter implements UserManagementPort {
  constructor(private readonly client: DirectusAuthClient) {}

  async listUsers(): Promise<ManagedUser[]> {
    // Excluir administradores: se gestionan solo desde Directus
    const users = await this.client.request<DirectusUserWithRole[]>(
      readUsers({
        fields: ['id', 'email', 'first_name', 'last_name', 'avatar', 'status', 'role.id', 'role.name'],
        filter: { role: { name: { _neq: 'Administrator' } } },
      } as any)
    );

    // Obtener todas las asignaciones de policies en batch (evita N+1).
    // directus_access no tiene funciones dedicadas en el SDK; se usa customEndpoint.
    const allAccess = await this.client.request<DirectusAccessItem[]>(
      customEndpoint<DirectusAccessItem[]>({
        path: '/access',
        params: {
          fields: ['id', 'user', 'policy.id', 'policy.name'],
          filter: { user: { _nnull: true } },
        },
      })
    );

    // Agrupar asignaciones por userId
    const assignmentsByUser = new Map<string, PolicyAssignment[]>();
    for (const access of allAccess) {
      const userId = access.user;
      if (!userId || !access.policy) continue;

      const policyId = extractPolicyId(access.policy);
      const policyName = extractPolicyName(access.policy);

      const existing = assignmentsByUser.get(userId) ?? [];
      existing.push({ id: access.id, userId, policyId, policyName });
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

    return toManagedUser({ ...created, status: created.status ?? 'active', role: created.role ?? null }, []);
  }

  async updateUserRole(userId: string, roleId: string): Promise<void> {
    await this.client.request(
      updateUser(userId, { role: roleId })
    );
  }

  async listRoles(): Promise<Role[]> {
    const roles = await this.client.request<DirectusRole[]>(
      readRoles({
        fields: ['id', 'name'] as any,
      })
    );
    return roles.map(toRole);
  }

  async listPolicies(): Promise<Policy[]> {
    const policies = await this.client.request<DirectusPolicyItem[]>(
      (readPolicies as any)({
        fields: ['id', 'name', 'description'],
      })
    );

    // Excluir la policy interna "Administrator" de Directus
    return policies
      .filter(p => p.name !== 'Administrator')
      .map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
      }));
  }

  async getUserPolicyAssignments(userId: string): Promise<PolicyAssignment[]> {
    const access = await this.client.request<DirectusAccessItem[]>(
      customEndpoint<DirectusAccessItem[]>({
        path: '/access',
        params: {
          fields: ['id', 'user', 'policy.id', 'policy.name'],
          filter: { user: { _eq: userId } },
        },
      })
    );

    return access
      .filter(a => !!a.policy)
      .map(a => ({
        id: a.id,
        userId,
        policyId: extractPolicyId(a.policy),
        policyName: extractPolicyName(a.policy),
      }));
  }

  async assignPolicy(userId: string, policyId: string): Promise<PolicyAssignment> {
    const result = await this.client.request<DirectusAccessItem>(
      customEndpoint<DirectusAccessItem>({
        path: '/access',
        method: 'POST',
        body: JSON.stringify({ user: userId, policy: policyId }),
      })
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
      customEndpoint<null>({
        path: `/access/${assignmentId}`,
        method: 'DELETE',
      })
    );
  }

  async updateUserStatus(userId: string, status: UserStatus): Promise<void> {
    await this.client.request(
      updateUser(userId, { status })
    );
  }
}