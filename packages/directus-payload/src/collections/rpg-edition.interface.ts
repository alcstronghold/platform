import { DefaultCollection } from '../default-collection.interface.js';

/**
 * Payload structure as defined in the JSON data file.
 * Uses identifiers (slugs) for relationships that will be resolved to UUIDs during import.
 */
export interface RpgEditionPayload {
  identifier: string;
  name: string;
  rpg_system_id: string | null; // identifier of the system (null if not applicable)
  rpg_family_id: string; // identifier of the family
  translations: Record<string, string>; // Add translations to match JSON
  bgg_id?: number | null; // BoardGameGeek ID
}

/**
 * Request structure sent to Directus API for creating/updating items.
 * Uses UUIDs for relationships.
 */
export interface RpgEditionRequest {
  identifier: string;
  name: string;
  rpg_system_id: string | null; // UUID (optional)
  rpg_family_id: string; // UUID (replaces game_id)
  bgg_id?: number | null;
  // Translations usually handled separately or via nested creation depending on setup
  // but keeping it simple for now as per other imports
}

/**
 * Response structure from Directus API including system fields.
 */
export interface RpgEdition extends DefaultCollection {
  identifier: string;
  name: string;
  rpg_system_id: string | null;
  rpg_family_id: string;
  bgg_id?: number | null;
}