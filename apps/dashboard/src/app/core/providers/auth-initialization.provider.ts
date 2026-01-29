import { type EnvironmentProviders, inject, provideAppInitializer } from '@angular/core';

import { AuthService } from '../services/auth.service';

/**
 * Proporciona la inicialización automática de AuthService al arrancar la app.
 * Esto permite restaurar sesiones existentes después de recargar (F5).
 *
 * AuthService.initialize() verifica si existe una sesión válida en el backend
 * (cookie HTTP-only) y restaura el estado del usuario si es posible.
 */
export function provideAuthInitialization(): EnvironmentProviders {
  return provideAppInitializer(() => {
    const authService = inject(AuthService);
    return authService.initialize();
  });
}
