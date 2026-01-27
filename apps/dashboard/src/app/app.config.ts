import { APP_INITIALIZER, type ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { ConfigService } from './core/config/config.service';
import { provideDirectus } from './core/providers/directus.provider';

function initializeConfig(configService: ConfigService) {
  return () => configService.loadConfig();
}

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: initializeConfig,
      deps: [ConfigService],
      multi: true,
    },
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideDirectus(),
  ],
};
