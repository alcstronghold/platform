import {Genre} from "@stronghold-domain/genre.interface.js";
import {DefaultCollection} from "@stronghold-models/default-collection.interface.js";

import {LanguageCodes} from "../types/language-code.type.js";


export interface RpgGamePayload {
  identifier: string;
  translations: Record<LanguageCodes, string>;
  genres: Array<string>;
}

export interface RpgGameRequest {
  identifier: string;
  translations: Array<RpgGameTranslations>;
  genres: Array<RpgGameGenreRequest>;
}

export interface RpgGameGenreRequest {
  genres_id: string;
}

export interface RpgGame extends DefaultCollection {
  identifier: string;
  translations: Array<RpgGameTranslations>;
  genres: Array<RpgGameGenre>;
}

export interface RpgGameGenre {
  genres_id: string | Genre;
}

export interface RpgGameTranslations {
  languages_code: LanguageCodes;
  name: string;
}
