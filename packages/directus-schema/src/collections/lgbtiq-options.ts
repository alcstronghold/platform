import type { TranslatableEntity, Translation } from './base';

/**
 * LGBTIQ+ community options for statistics
 * Values: 'yes', 'no', 'unsure', 'ally'
 */
export interface LgbtiqOption extends TranslatableEntity {
  name: string;
}

export interface LgbtiqOptionTranslation extends Translation {
  lgbtiq_options_id: string;
  name: string;
}

export type LgbtiqOptionCode = 'yes' | 'no' | 'unsure' | 'ally';
