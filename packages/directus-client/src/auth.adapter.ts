import type { AuthenticatedUser,AuthPort, AuthResult, LoginCredentials } from '@alcstronghold/domain';
import { toAuthenticatedUser } from '@alcstronghold/domain';
import { readMe } from '@directus/sdk';

import type { DirectusAuthClient } from './client.js';

/**
 * Directus user response from /users/me
 */
interface DirectusUser {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar: string | null;
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
          fields: ['id', 'email', 'first_name', 'last_name', 'avatar'],
        })
      );

      if (!me?.id || !me?.email) {
        return null;
      }

      return toAuthenticatedUser({
        id: me.id,
        email: me.email,
        firstName: me.first_name,
        lastName: me.last_name,
        avatar: me.avatar,
      });
    } catch {
      return null;
    }
  }
}
