import type { TranslatableEntity, Translation } from './base';

/**
 * RPG Family entity (M2M with settings)
 */
export interface RpgFamily extends TranslatableEntity {
  name: string;
  settings: number[] | RpgFamiliesSettings[];
  editions: number[];
}

/**
 * RPG Family translation
 */
export interface RpgFamilyTranslation extends Translation {
  rpg_families_id: string;
  name: string;
  description: string | null;
}

/**
 * Junction table: rpg_families <-> settings (M2M)
 */
export interface RpgFamiliesSettings {
  id: number;
  rpg_families_id: string;
  settings_id: string;
}
