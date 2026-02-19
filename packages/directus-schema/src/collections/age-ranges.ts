import type { TranslatableEntity, Translation } from './base';

/**
 * Age range options for sessions
 * Values: '6-9', '10-12', '+13', '+16', '+18'
 */
export interface AgeRange extends TranslatableEntity {
  name: string;
}

export interface AgeRangeTranslation extends Translation {
  age_ranges_id: string;
  name: string;
}

export type AgeRangeCode = '6-9' | '10-12' | '+13' | '+16' | '+18';
