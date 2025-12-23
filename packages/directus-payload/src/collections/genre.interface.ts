import { DefaultCollection } from '../default-collection.interface.js';
import { LanguageCodes } from '../types/language-code.type.js';

export interface GenrePayload {
  identifier: string;
  parent?: string;
  translations: Record<LanguageCodes, string>;
}

export interface GenreRequest {
  identifier: string;
  parent_id?: string;
  translations: Array<GenreTranslation>;
}

export interface Genre extends DefaultCollection {
  identifier: string;
  parent_id?: string;
  translations: Array<GenreTranslation>;
  settings: Array<GenreSetting>;
}

export interface GenreSetting {
  settings_id: string;
}

export interface GenreTranslation {
  languages_code: LanguageCodes;
  name: string;
}
