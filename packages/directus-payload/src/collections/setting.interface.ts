import type { LanguageCodes } from '@alcstronghold/directus-schema';

export interface SettingPayload {
  identifier: string;
  name: string;
  translations: Record<LanguageCodes, string>;
  genres: Array<string>;
}
