import type { LanguageCodes } from '@alcstronghold/directus-schema';

export interface RpgSystemPayload {
  identifier: string;
  bgg_id?: number | string;
  translations: Record<LanguageCodes, string>;
}
