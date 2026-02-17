import type { AuthenticatedUser, AuthPort, AuthResult, LoginCredentials, UserRole } from '@alcstronghold/domain';
import { toAuthenticatedUser } from '@alcstronghold/domain';
import { readMe } from '@directus/sdk';

import type { DirectusAuthClient } from './client.js';

/**
 * Directus role response anidada en /users/me
 */
interface DirectusRole {
  id: string;
  name: string;
  admin_access: boolean;
}

/**
 * Directus user response from /users/me
 */
interface DirectusUser {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar: string | null;
  role: DirectusRole | null;
}

function toUserRole(role: DirectusRole): UserRole {
  return {
    id: role.id,
    name: role.name,
    adminAccess: role.admin_access,
  };
}

/**
 * Directus Auth Adapter
 * Implementa AuthPort usando el Directus SDK con JSON tokens
 */
export class DirectusAuthAdapter implements AuthPort {
  constructor(private readonly client: DirectusAuthClient) {}

  async login(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      await this.client.login({
        email: credentials.email,
        password: credentials.password,
      });

      const user = await this.getCurrentUser();
      if (!user) {
        return { success: false, error: 'No se pudo obtener el usuario tras el login' };
      }

      return { success: true, user };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error de autenticación';
      return { success: false, error: message };
    }
  }

  async logout(): Promise<void> {
    try {
      await this.client.logout();
    } catch {
      // Ignore logout errors (session may already be invalid)
    }
  }

  async refreshToken(): Promise<AuthResult> {
    try {
      await this.client.refresh();
      const user = await this.getCurrentUser();
      return user
        ? { success: true, user }
        : { success: false, error: 'La sesión ha expirado' };
    } catch {
      return { success: false, error: 'No se pudo refrescar la sesión' };
    }
  }

  async getCurrentUser(): Promise<AuthenticatedUser | null> {
    try {
      const me = await this.client.request<DirectusUser>(
        readMe({
          // Los campos anidados de role no están tipados en el SDK genérico
          fields: ['id', 'email', 'first_name', 'last_name', 'avatar', 'role.id', 'role.name', 'role.admin_access'] as any,
        })
      );

      if (!me?.id || !me?.email) {
        return null;
      }

      const role = me.role ? toUserRole(me.role) : undefined;

      return toAuthenticatedUser(
        {
          id: me.id,
          email: me.email,
          firstName: me.first_name,
          lastName: me.last_name,
          avatar: me.avatar,
        },
        role,
      );
    } catch {
      return null;
    }
  }
}
