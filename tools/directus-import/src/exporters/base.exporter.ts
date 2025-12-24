import type { LanguageCodes } from '@alcstronghold/directus-schema';

import type { ExporterConfig, ExportResult } from '../types';

export type { ExporterConfig, ExportResult };

// Re-export LanguageCodes for convenience
export type { LanguageCodes };

// Array of supported language codes for iteration
export const LANGUAGE_CODES: LanguageCodes[] = ['es-ES', 'ca-ES'];
