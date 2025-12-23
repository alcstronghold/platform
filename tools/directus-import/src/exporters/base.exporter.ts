import type { LanguageCodes } from '@alcstronghold/directus-schema';
import type { RestClient } from '@directus/sdk';

export interface ExporterConfig {
  client: RestClient<object>;
}

export interface ExportResult {
  collection: string;
  total: number;
  errors: string[];
}

// Re-export LanguageCodes for convenience
export type { LanguageCodes };

// Array of supported language codes for iteration
export const LANGUAGE_CODES: LanguageCodes[] = ['es-ES', 'ca-ES'];
