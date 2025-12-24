export interface SettingTranslation {
  languages_code: string;
  name: string;
}

export interface GenreRelation {
  genres_id: string | { id: string; identifier: string };
}

export interface SettingEntity {
  identifier: string;
  name: string;
  translations: SettingTranslation[];
  genres: GenreRelation[];
}
