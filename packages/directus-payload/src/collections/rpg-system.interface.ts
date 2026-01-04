import type { LanguageCodes } from '@alcstronghold/directus-schema';

export interface RpgSystemPayload {
  identifier: string;
  name: string;
  bgg_id: number | null;
  translations: Record<LanguageCodes, string>;
}
