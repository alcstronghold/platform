import type { AuthenticatedUser, AuthPort, AuthResult, LoginCredentials, UserRole } from '@alcstronghold/domain';
import { toAuthenticatedUser } from '@alcstronghold/domain';
import { customEndpoint, readMe } from '@directus/sdk';

import type { DirectusAuthClient } from './client.js';

interface DirectusRoleBasic {
  id: string;
  name: string;
}

interface DirectusAccessItem {
  id: string;
  policy: { id: string; name: string } | string;
  user: string | null;
  role: string | null;
}

interface DirectusUser {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar: string | null;
  role: DirectusRoleBasic | null;
}

interface JwtPayload {
  admin_access?: boolean;
}

/**
 * Decodifica el payload de un JWT sin verificar la firma.
 * Solo se usa en el cliente para obtener claims como admin_access.
 */
function decodeJwtPayload(token: string): JwtPayload {
  try {
    const base64 = token.split('.')[1];
    if (!base64) return {};
    // Reemplazar caracteres base64url a base64 estándar
    const normalized = base64.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(normalized)) as JwtPayload;
  } catch {
    return {};
  }
}

/**
 * Directus Auth Adapter
 * Implementa AuthPort usando el Directus SDK con JSON tokens.
 *
 * Nota sobre admin_access: En Directus 11, el campo admin_access de
 * directus_roles es inaccesible vía la API REST. Se obtiene del JWT
 * del access_token, donde Directus incluye este claim directamente.
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
      // Ignorar errores de logout (la sesión puede ya ser inválida)
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
          fields: ['id', 'email', 'first_name', 'last_name', 'avatar', 'role.id', 'role.name'] as any,
        })
      );

      if (!me?.id || !me?.email) {
        return null;
      }

      let role: UserRole | undefined;
      if (me.role?.id) {
        // admin_access no es accesible vía la API REST de Directus 11 (campo restringido).
        // Se obtiene del JWT donde Directus incluye este claim directamente.
        const token = await (this.client as any).getToken?.() as string | null | undefined;
        const adminAccess = token ? decodeJwtPayload(token).admin_access === true : false;

        role = { id: me.role.id, name: me.role.name, adminAccess };
      }

      // Obtener policies del usuario (directas + via rol)
      const policies = await this.loadUserPolicies(me.id, me.role?.id ?? null);

      return toAuthenticatedUser(
        {
          id: me.id,
          email: me.email,
          firstName: me.first_name,
          lastName: me.last_name,
          avatar: me.avatar,
          status: 'active',
        },
        role,
        policies,
      );
    } catch {
      return null;
    }
  }

  /**
   * Carga los nombres de policies asignadas al usuario.
   * Combina asignaciones directas (por user) y por rol (por role), sin duplicados.
   */
  private async loadUserPolicies(userId: string, roleId: string | null): Promise<string[]> {
    try {
      // Consulta asignaciones directas al usuario
      const userAccess = await this.client.request<DirectusAccessItem[]>(
        customEndpoint<DirectusAccessItem[]>({
          path: '/access',
          params: {
            fields: ['id', 'policy.id', 'policy.name'],
            filter: { user: { _eq: userId } },
          },
        })
      );

      // Consulta asignaciones al rol del usuario
      let roleAccess: DirectusAccessItem[] = [];
      if (roleId) {
        roleAccess = await this.client.request<DirectusAccessItem[]>(
          customEndpoint<DirectusAccessItem[]>({
            path: '/access',
            params: {
              fields: ['id', 'policy.id', 'policy.name'],
              filter: { role: { _eq: roleId } },
            },
          })
        );
      }

      // Combinar y deduplicar por nombre de policy
      const allAccess = [...userAccess, ...roleAccess];
      const policyNames = new Set<string>();
      for (const item of allAccess) {
        const name = typeof item.policy === 'string' ? '' : item.policy?.name;
        if (name) {
          policyNames.add(name);
        }
      }

      return [...policyNames];
    } catch {
      // Si falla la carga de policies, continuar sin ellas
      return [];
    }
  }
}
