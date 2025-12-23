import { Genre } from '@stronghold-domain/genre.interface.js';
import { DefaultCollection } from '@stronghold-models/default-collection.interface.js';
import { LanguageCodes } from '@stronghold-types/language-code.type.js';

/**
 * Payload: Estructura del JSON de entrada
 */
export interface SettingPayload {
  identifier: string;
  name: string;
  translations: Record<LanguageCodes, string>;
  genres: Array<string>;
}

/**
 * Request: Estructura para enviar a la API de Directus
 */
export interface SettingRequest {
  identifier: string;
  name: string;
  translations: Array<SettingTranslation>;
  genres: Array<SettingGenreRequest>;
}

export interface SettingGenreRequest {
  genres_id: string;
}

/**
 * Setting: Estructura de respuesta de Directus
 */
export interface Setting extends DefaultCollection {
  identifier: string;
  name: string;
  translations: Array<SettingTranslation>;
  genres: Array<SettingGenre>;
}

export interface SettingGenre {
  genres_id: string | Genre;
}

export interface SettingTranslation {
  languages_code: LanguageCodes;
  name: string;
}