import { IMAGE_LOADER } from '@angular/common';
import { type ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { ConfigService } from './core/config/config.service';
import { provideDirectus } from './core/providers/directus.provider';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAppInitializer(() => {
      const configService = inject(ConfigService);
      return configService.loadConfig();
    }),
    {
      provide: IMAGE_LOADER,
      useValue: (config: { src: string }) => config.src,
    },
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideDirectus(),
  ],
};
