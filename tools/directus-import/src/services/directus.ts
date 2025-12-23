import { authentication, createDirectus, rest, staticToken } from '@directus/sdk';

export interface DirectusConfig {
  url: string;
  token?: string;
  email?: string;
  password?: string;
}

/**
 * Create a Directus client with authentication
 */
export async function createClient(config: DirectusConfig) {
  const client = createDirectus(config.url).with(rest());

  if (config.token) {
    return client.with(staticToken(config.token));
  }

  if (config.email && config.password) {
    const authClient = client.with(authentication());
    await authClient.login(config.email, config.password);
    return authClient;
  }

  throw new Error('Either token or email/password must be provided');
}
