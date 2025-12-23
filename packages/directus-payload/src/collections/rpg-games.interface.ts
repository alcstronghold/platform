import type { LanguageCodes } from '@alcstronghold/directus-schema';

export interface RpgGamePayload {
  identifier: string;
  translations: Record<LanguageCodes, string>;
  genres: Array<string>;
}
