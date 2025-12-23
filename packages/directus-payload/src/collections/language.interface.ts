import {DefaultCollection} from '../default-collection.interface.js';

export type LanguageDirection = 'ltr' | 'rtl';

export interface Language extends DefaultCollection {
  code: string;
  name: string;
  direction: LanguageDirection;
}

export interface LanguagePayload {
  code: string;
  name: string;
  direction: LanguageDirection;
}

export interface LanguageRequest {
  code: string;
  name: string;
  direction: LanguageDirection;
}
