import type { TranslatableEntity, Translation } from './base';

/**
 * Genre entity (hierarchical with parent_id)
 */
export interface Genre extends TranslatableEntity {
  parent_id: string | null;
  settings: number[];
}

/**
 * Genre translation
 */
export interface GenreTranslation extends Translation {
  genres_id: string;
  name: string;
  description: string | null;
}