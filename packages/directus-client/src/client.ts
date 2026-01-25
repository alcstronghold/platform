import {
  authentication,
  type AuthenticationClient,
  createDirectus,
  type DirectusClient,
  rest,
  type RestClient,
} from '@directus/sdk';

/**
 * Directus client type with authentication and REST capabilities
 */
export type DirectusAuthClient = DirectusClient<object> &
  AuthenticationClient<object> &
  RestClient<object>;

/**
 * Configuration for creating a Directus client
 */
export interface DirectusClientConfig {
  url: string;
}

/**
 * Create an auth client for browser/client-side use
 * Uses cookie-based sessions with credentials included
 */
export function createBrowserClient(config: DirectusClientConfig): DirectusAuthClient {
  return createDirectus(config.url)
    .with(authentication('session', { credentials: 'include' }))
    .with(rest({ credentials: 'include' }));
}

/**
 * Create a server client for SSR use
 * Forwards cookies from incoming request headers
 */
export function createServerClient(
  config: DirectusClientConfig,
  requestHeaders?: Headers
): DirectusAuthClient {
  return createDirectus(config.url)
    .with(authentication('session'))
    .with(
      rest({
        onRequest: (options) => {
          if (requestHeaders) {
            const cookie = requestHeaders.get('cookie');
            if (cookie) {
              options.headers = { ...options.headers, cookie };
            }
          }
          return options;
        },
      })
    );
}
