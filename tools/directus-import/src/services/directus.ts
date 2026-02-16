import { authentication, createDirectus, rest, staticToken } from '@directus/sdk';

import type { DirectusConfig } from '../types';
export type { DirectusConfig } from '../types';

/**
 * Create a Directus client with authentication
 */
export async function createClient(config: DirectusConfig) {
  if (config.token) {
    // Order matters: staticToken before rest
    return createDirectus(config.url)
      .with(staticToken(config.token))
      .with(rest());
  }

  const client = createDirectus(config.url).with(rest());

  if (config.email && config.password) {
    const authClient = client.with(authentication());
    const payload = { email: config.email, password: config.password };
    await authClient.login(payload);
    return authClient;
  }

  throw new Error('Either token or email/password must be provided');
}
