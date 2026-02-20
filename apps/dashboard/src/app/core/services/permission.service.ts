import { computed, inject, Injectable } from '@angular/core';

import { AuthService } from './auth.service';

/**
 * Servicio centralizado de permisos.
 * Expone computed signals que determinan qué puede hacer el usuario actual
 * basándose en su rol (adminAccess) y sus policies asignadas.
 */
@Injectable({ providedIn: 'root' })
export class PermissionService {
  private readonly authService = inject(AuthService);

  readonly isAdmin = computed(
    () => this.authService.user()?.role?.adminAccess === true,
  );

  /** Tiene la policy 'Master' */
  readonly isMaster = computed(() => this.hasPolicy('Master'));

  /** Tiene la policy 'Comisión de Rol' */
  readonly isComisionRol = computed(() => this.hasPolicy('Comisión de Rol'));

  /** Admin o Comisión: ve TODAS las sesiones */
  readonly canViewAllSessions = computed(
    () => this.isAdmin() || this.isComisionRol(),
  );

  /** Admin, Comisión o Master: puede acceder al módulo de sesiones */
  readonly canAccessSessions = computed(
    () => this.isAdmin() || this.isComisionRol() || this.isMaster(),
  );

  /** Admin, Comisión o Master: puede crear sesiones */
  readonly canCreateSessions = computed(
    () => this.isAdmin() || this.isComisionRol() || this.isMaster(),
  );

  private hasPolicy(name: string): boolean {
    return this.authService.user()?.policies?.includes(name) ?? false;
  }
}
