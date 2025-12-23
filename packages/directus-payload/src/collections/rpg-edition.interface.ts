import type { LanguageCodes } from '@alcstronghold/directus-schema';

export interface RpgEditionPayload {
  identifier: string;
  name: string;
  rpg_system_id: string | null; // identifier of the system (null if not applicable)
  rpg_family_id: string; // identifier of the family
  translations: Record<LanguageCodes, string>; // Add translations to match JSON
  bgg_id?: number | null; // BoardGameGeek ID
}
