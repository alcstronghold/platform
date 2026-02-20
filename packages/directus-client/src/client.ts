import {
  authentication,
  type AuthenticationClient,
  type AuthenticationData,
  type AuthenticationStorage,
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

const AUTH_STORAGE_KEY = 'directus-auth';

/**
 * Almacena los tokens de autenticación en localStorage
 * para que sobrevivan al refresh del navegador.
 */
function browserStorage(): AuthenticationStorage {
  return {
    get() {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as AuthenticationData;
    },
    set(data: AuthenticationData | null) {
      if (data) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    },
  };
}

/**
 * Create an auth client for browser/client-side use
 * Persiste tokens en localStorage para mantener la sesión entre recargas.
 */
export function createBrowserClient(config: DirectusClientConfig): DirectusAuthClient {
  return createDirectus(config.url)
    .with(authentication('json', { storage: browserStorage() }))
    .with(rest());
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
