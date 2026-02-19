import type { TranslatableEntity, Translation } from './base';

/**
 * Accessibility accommodations available
 * Values: 'visual', 'auditory', 'reading', 'other'
 */
export interface AccessibilityOption extends TranslatableEntity {
  name: string;
}

export interface AccessibilityOptionTranslation extends Translation {
  accessibility_options_id: string;
  name: string;
  description: string | null;
}

export type AccessibilityOptionCode = 'visual' | 'auditory' | 'reading' | 'other';
