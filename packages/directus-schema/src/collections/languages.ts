import type { TextDirection } from './base';

/**
 * Language definition for i18n support
 */
export interface Language {
  code: string;
  name: string;
  direction: TextDirection;
}