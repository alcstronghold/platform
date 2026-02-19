import type { TranslatableEntity, Translation } from './base';

/**
 * Safety tools used in sessions
 * Values: 'x_card', 'semaphore', 'luxton', 'open_door', 'lines_veils', 'other'
 */
export interface SafetyMeasure extends TranslatableEntity {
  name: string;
}

export interface SafetyMeasureTranslation extends Translation {
  safety_measures_id: string;
  name: string;
  description: string | null;
}

export type SafetyMeasureCode =
  | 'x_card'
  | 'semaphore'
  | 'luxton'
  | 'open_door'
  | 'lines_veils'
  | 'other';
