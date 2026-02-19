import type { TranslatableEntity, Translation } from './base';

/**
 * Languages available for sessions
 * Values: 'es', 'ca', 'en', 'decided_by_group'
 */
export interface SessionLanguage extends TranslatableEntity {
  exclusive_selection: boolean;
}

export interface SessionLanguageTranslation extends Translation {
  session_languages_id: string;
  name: string;
}

export type SessionLanguageCode = 'es' | 'ca' | 'en' | 'decided_by_group';
