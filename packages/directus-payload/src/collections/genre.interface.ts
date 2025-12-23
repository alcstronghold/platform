import { LanguageCodes } from '@alcstronghold/directus-schema';

export interface GenrePayload {
  identifier: string;
  parent?: string;
  translations: Record<LanguageCodes, string>;
}
