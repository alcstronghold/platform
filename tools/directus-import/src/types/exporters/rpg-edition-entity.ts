export interface RpgEditionTranslation {
  languages_code: string;
  name: string;
}

export interface RpgEditionEntity {
  identifier: string;
  name: string;
  bgg_id: number | null;
  rpg_system_id: string | null | { id: string; identifier: string };
  rpg_family_id: string | { id: string; identifier: string };
  translations: RpgEditionTranslation[];
}
