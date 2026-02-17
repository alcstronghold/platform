import {
  createBrowserClient,
  DirectusAuthAdapter,
  type DirectusAuthClient,
  DirectusUserManagementAdapter,
} from '@alcstronghold/directus-client';
import type { AuthPort, UserManagementPort } from '@alcstronghold/domain';
import { InjectionToken, type Provider } from '@angular/core';

import { ConfigService } from '../config/config.service';

export const DIRECTUS_CLIENT = new InjectionToken<DirectusAuthClient>('DIRECTUS_CLIENT');
export const AUTH_PORT = new InjectionToken<AuthPort>('AUTH_PORT');
export const USER_MANAGEMENT_PORT = new InjectionToken<UserManagementPort>('USER_MANAGEMENT_PORT');

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
  ];
}