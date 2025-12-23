/**
 * Common status values for Directus collections
 */
export type Status = 'draft' | 'published' | 'archived';

/**
 * Text direction for languages
 */
export type TextDirection = 'ltr' | 'rtl';

/**
 * Base fields present in most Directus collections
 */
export interface BaseEntity {
  id: string;
  status: Status;
  sort: number | null;
  user_created: string;
  date_created: string;
  user_updated: string | null;
  date_updated: string | null;
}

/**
 * Base fields for entities with an identifier
 */
export interface IdentifiableEntity extends BaseEntity {
  identifier: string;
}

/**
 * Base fields for entities with translations
 */
export interface TranslatableEntity extends IdentifiableEntity {
  translations: number[] | Translation[];
}

/**
 * Base translation fields
 */
export interface Translation {
  id: number;
  languages_code: string;
}