export interface GenreTranslation {
  languages_code: string;
  name: string;
}

export interface GenreEntity {
  id: string;
  identifier: string;
  name: string;
  parent_id: string | null | { id: string; identifier: string };
  translations: GenreTranslation[];
}
