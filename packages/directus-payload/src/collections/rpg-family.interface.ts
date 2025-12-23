import type { LanguageCodes } from '@alcstronghold/directus-schema';

export interface RpgFamilyPayload {
  identifier: string;
  name: string;
  translations: Record<LanguageCodes, string>;
  settings: Array<string>; // Array of setting identifiers
}
