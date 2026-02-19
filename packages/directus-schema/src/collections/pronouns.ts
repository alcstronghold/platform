import type { TranslatableEntity, Translation } from './base';

/**
 * Pronoun options for user profiles
 * Values: 'elli', 'ella', 'ell', 'other'
 */
export interface Pronoun extends TranslatableEntity {
  name: string;
}

export interface PronounTranslation extends Translation {
  pronouns_id: string;
  name: string;
}

export type PronounCode = 'elli' | 'ella' | 'ell' | 'other';
