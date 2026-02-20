import type { TranslatableEntity, Translation } from './base';

/**
 * Content warnings for sessions
 * Values: 'none', 'violence', 'hospitals', 'mental_health', 'discrimination', 'sexual_violence', 'other'
 */
export interface ContentWarning extends TranslatableEntity {
  exclusive_selection: boolean;
}

export interface ContentWarningTranslation extends Translation {
  content_warnings_id: string;
  name: string;
  description: string | null;
}

export type ContentWarningCode =
  | 'none'
  | 'violence'
  | 'hospitals'
  | 'mental_health'
  | 'discrimination'
  | 'sexual_violence'
  | 'other';
