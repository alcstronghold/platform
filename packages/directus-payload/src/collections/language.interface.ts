import type { TextDirection } from '@alcstronghold/directus-schema';


export interface LanguagePayload {
  code: string;
  name: string;
  direction: TextDirection;
}
