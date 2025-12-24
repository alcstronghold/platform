import type { DirectusClient, RestClient, StaticTokenClient } from '@directus/sdk';

export interface ImporterConfig {
  /** Directus client instance */
  client: DirectusClient<object> & RestClient<object> & StaticTokenClient<object>;
  /** Directus URL (for native fetch when SDK has bugs) */
  url: string;
  /** Authentication token */
  token: string;
  /** Whether to show verbose output */
  verbose?: boolean;
}
