import { LanguageCodes } from '@alcstronghold/directus-schema';

export interface GenrePayload {
  identifier: string;
  name: string;
  parent?: string | null;
  translations: Record<LanguageCodes, string>;
}
