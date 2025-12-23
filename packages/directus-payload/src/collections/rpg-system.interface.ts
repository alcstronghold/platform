import { DefaultCollection } from '@stronghold-models/default-collection.interface.js';
import { LanguageCodes } from '@stronghold-types/language-code.type.js';

export interface RpgSystemPayload {
  identifier: string;
  bgg_id?: number | string;
  translations: Record<LanguageCodes, string>;
}

export interface RpgSystemRequest {
  identifier: string;
  bgg_id: number | null;
  translations: Array<RpgSystemTranslation>;
}

export interface RpgSystem extends DefaultCollection {
  identifier: string;
  bgg_id: number | null;
  translations: Array<RpgSystemTranslation>;
}

export interface RpgSystemTranslation {
  languages_code: LanguageCodes;
  name: string;
}
