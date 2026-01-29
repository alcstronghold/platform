import { type EnvironmentProviders, inject, provideAppInitializer } from '@angular/core';

import { ConfigService } from '../config/config.service';

/**
 * Proporciona la inicialización automática de ConfigService al arrancar la app.
 * Carga la configuración desde archivos JSON incrementales (config.json,
 * config.<environment>.json, config.local.json).
 */
export function provideConfiguration(): EnvironmentProviders {
  return provideAppInitializer(() => {
    const configService = inject(ConfigService);
    return configService.loadConfig();
  });
}
