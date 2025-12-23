/**
 * Collection import order (respects foreign key dependencies)
 */
export const COLLECTION_ORDER = [
  'languages',
  'genres',
  'publishers',
  'rpg_families',
  'rpg_systems',
  'rpg_editions',
  'settings',
  'genres_translations',
  'rpg_families_translations',
  'rpg_systems_translations',
  'rpg_editions_translations',
  'settings_translations',
  'settings_genres',
  'rpg_families_settings',
] as const;

export type CollectionName = (typeof COLLECTION_ORDER)[number];

/**
 * Map of collection names to their payload file names
 */
export const COLLECTION_FILES: Record<string, string> = {
  languages: 'languages.json',
  genres: 'genres.json',
  publishers: 'publishers.json',
  rpg_families: 'rpg-families.json',
  rpg_systems: 'rpg-systems.json',
  rpg_editions: 'rpg-editions.json',
  settings: 'settings.json',
};
