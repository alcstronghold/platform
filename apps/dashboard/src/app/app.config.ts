import { type ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideAuthInitialization } from './core/providers/auth-initialization.provider';
import { provideConfiguration } from './core/providers/config.provider';
import { provideDirectus } from './core/providers/directus.provider';
import { provideImageLoader } from './core/providers/image-loader.provider';

export const appConfig: ApplicationConfig = {
  providers: [
    provideConfiguration(),
    provideImageLoader(),
    provideAuthInitialization(),
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideDirectus(),
  ],
};
