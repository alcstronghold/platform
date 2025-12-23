import { DefaultCollection } from '../default-collection.interface.js';
import { LanguageCodes } from '../types/language-code.type.js';

export interface RpgFamilyPayload {
  identifier: string;
  name: string;
  translations: Record<LanguageCodes, string>;
  settings: string[]; // Array of setting identifiers
}

export interface RpgFamilyRequest {
  identifier: string;
  name: string;
  translations: {
    languages_code: LanguageCodes;
    name: string;
  }[];
  settings: { settings_id: string }[]; // M2M relationship
}

export interface RpgFamily extends DefaultCollection {
  identifier: string;
  name: string;
  translations: any[]; // Typed loosely here as we mostly read this for id
  settings: any[];
}
