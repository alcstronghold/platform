import type { RestClient } from '@directus/sdk';

export interface ExporterConfig {
  client: RestClient<object>;
}
