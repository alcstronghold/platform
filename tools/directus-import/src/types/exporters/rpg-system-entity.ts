export interface RpgSystemTranslation {
  languages_code: string;
  name: string;
}

export interface RpgSystemEntity {
  identifier: string;
  name: string;
  bgg_id: number | null;
  translations: RpgSystemTranslation[];
}
