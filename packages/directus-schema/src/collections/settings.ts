import type { TranslatableEntity, Translation } from './base';

/**
 * Setting entity (M2M with genres)
 */
export interface Setting extends TranslatableEntity {
  name: string;
  genres: number[] | SettingsGenres[];
  rpg_families: number[];
}

/**
 * Setting translation
 */
export interface SettingTranslation extends Translation {
  settings_id: string;
  name: string;
  description: string | null;
}

/**
 * Junction table: settings <-> genres (M2M)
 */
export interface SettingsGenres {
  id: number;
  settings_id: string;
  genres_id: string;
}
