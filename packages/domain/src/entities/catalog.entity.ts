/**
 * Elemento genérico de catálogo con traducción resuelta
 */
export interface CatalogItem {
  id: string;
  identifier: string;
  name: string;
  description: string | null;
  exclusive: boolean;
}

/**
 * Familia de juegos de rol (ej: D&D, Pathfinder)
 * Tiene relación M2M con settings
 */
export interface RpgFamilyCatalog extends CatalogItem {
  settingIds: string[];
}

/**
 * Edición de juego de rol (ej: D&D 5e, Pathfinder 2e)
 * Relacionada con una familia y un sistema
 */
export interface RpgEditionCatalog extends CatalogItem {
  rpgFamilyId: string | null;
  rpgSystemId: string | null;
}

/**
 * Sistema de juego (ej: d20 System, Powered by the Apocalypse)
 */
export type RpgSystemCatalog = CatalogItem;

/**
 * Ambientación (ej: Forgotten Realms, Golarion)
 * Tiene relación M2M con géneros y familias
 */
export interface SettingCatalog extends CatalogItem {
  genreIds: string[];
  rpgFamilyIds: string[];
}

/**
 * Género (ej: Fantasía, Ciencia ficción, Terror)
 * Jerárquico: un género puede tener un padre
 */
export interface GenreCatalog extends CatalogItem {
  parentId: string | null;
}
