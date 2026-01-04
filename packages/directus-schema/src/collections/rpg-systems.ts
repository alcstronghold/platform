import type { TranslatableEntity, Translation } from './base';

/**
 * RPG System entity
 */
export interface RpgSystem extends TranslatableEntity {
  name: string;
  bgg_id: number | null;
  editions: number[];
}

/**
 * RPG System translation
 */
export interface RpgSystemTranslation extends Translation {
  rpg_systems_id: string;
  name: string;
  description: string | null;
}
