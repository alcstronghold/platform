export interface RpgFamilyTranslation {
  languages_code: string;
  name: string;
}

export interface SettingRelation {
  settings_id: string | { id: string; identifier: string };
}

export interface RpgFamilyEntity {
  identifier: string;
  name: string;
  translations: RpgFamilyTranslation[];
  settings: SettingRelation[];
}
