import { type EnvironmentProviders, inject, Injector, provideAppInitializer } from '@angular/core';

import { ConfigService } from '../config/config.service';
import { AuthService } from '../services/auth.service';

/**
 * Proporciona la inicialización automática de AuthService al arrancar la app.
 * Esto permite restaurar sesiones existentes después de recargar (F5).
 *
 * Espera a que ConfigService termine de cargar porque AuthService depende
 * de DIRECTUS_CLIENT, que necesita la URL del backend desde la configuración.
 * Los provideAppInitializer corren en paralelo, así que usamos loadConfig()
 * (idempotente) para garantizar que la configuración esté lista.
 */
export function provideAuthInitialization(): EnvironmentProviders {
  return provideAppInitializer(() => {
    const configService = inject(ConfigService);
    const injector = inject(Injector);

    // Esperar a que config esté cargada (idempotente: reutiliza la promise existente)
    return configService.loadConfig().then(() => {
      // Resolver AuthService DESPUÉS de que config esté lista,
      // para que DIRECTUS_CLIENT factory pueda llamar configService.get()
      const authService = injector.get(AuthService);
      return authService.initialize();
    });
  });
}
