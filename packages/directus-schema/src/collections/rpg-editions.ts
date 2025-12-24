import type { TranslatableEntity, Translation } from './base';

/**
 * RPG Edition entity (FK to rpg_families and rpg_systems)
 */
export interface RpgEdition extends TranslatableEntity {
  name: string;
  bgg_id: number | null;
  rpg_family: string | null;
  rpg_system: string | null;
}

/**
 * RPG Edition translation
 */
export interface RpgEditionTranslation extends Translation {
  rpg_editions_id: string;
  name: string;
  description: string | null;
}
