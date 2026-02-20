import {
  createBrowserClient,
  DirectusAuthAdapter,
  type DirectusAuthClient,
  DirectusCatalogAdapter,
  DirectusRpgSessionAdapter,
  DirectusUserManagementAdapter,
} from '@alcstronghold/directus-client';
import type { AuthPort, CatalogPort, RpgSessionPort, UserManagementPort } from '@alcstronghold/domain';
import { InjectionToken, type Provider } from '@angular/core';

import { ConfigService } from '../config/config.service';

export const DIRECTUS_CLIENT = new InjectionToken<DirectusAuthClient>('DIRECTUS_CLIENT');
export const AUTH_PORT = new InjectionToken<AuthPort>('AUTH_PORT');
export const USER_MANAGEMENT_PORT = new InjectionToken<UserManagementPort>('USER_MANAGEMENT_PORT');
export const RPG_SESSION_PORT = new InjectionToken<RpgSessionPort>('RPG_SESSION_PORT');
export const CATALOG_PORT = new InjectionToken<CatalogPort>('CATALOG_PORT');

export function provideDirectus(): Provider[] {
  return [
    {
      provide: DIRECTUS_CLIENT,
      useFactory: (configService: ConfigService) => {
        const config = configService.get();
        return createBrowserClient({ url: config.directusUrl });
      },
      deps: [ConfigService],
    },
    {
      provide: AUTH_PORT,
      useFactory: (client: DirectusAuthClient) => new DirectusAuthAdapter(client),
      deps: [DIRECTUS_CLIENT],
    },
    {
      provide: USER_MANAGEMENT_PORT,
      useFactory: (client: DirectusAuthClient) => new DirectusUserManagementAdapter(client),
      deps: [DIRECTUS_CLIENT],
    },
    {
      provide: RPG_SESSION_PORT,
      useFactory: (client: DirectusAuthClient) => new DirectusRpgSessionAdapter(client),
      deps: [DIRECTUS_CLIENT],
    },
    {
      provide: CATALOG_PORT,
      useFactory: (client: DirectusAuthClient) => new DirectusCatalogAdapter(client),
      deps: [DIRECTUS_CLIENT],
    },
  ];
}