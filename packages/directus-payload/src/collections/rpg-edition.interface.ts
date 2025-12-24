import type { LanguageCodes } from '@alcstronghold/directus-schema';

export interface RpgEditionPayload {
  identifier: string;
  name: string;
  rpg_system_id: string | null;
  rpg_family_id: string;
  translations: Record<LanguageCodes, string>;
  bgg_id: number | null;
}
