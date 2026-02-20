import type {
  CatalogItem,
  GenreCatalog,
  RpgEditionCatalog,
  RpgFamilyCatalog,
  RpgSystemCatalog,
  SettingCatalog,
} from '../entities/catalog.entity.js';

/**
 * Puerto para la lectura de catálogos de referencia (solo lectura en v1)
 */
export interface CatalogPort {
  listRpgFamilies(): Promise<RpgFamilyCatalog[]>;
  listRpgEditions(): Promise<RpgEditionCatalog[]>;
  listRpgSystems(): Promise<RpgSystemCatalog[]>;
  listSettings(): Promise<SettingCatalog[]>;
  listGenres(): Promise<GenreCatalog[]>;
  listAgeRanges(): Promise<CatalogItem[]>;
  listKnowledgeLevels(): Promise<CatalogItem[]>;
  listAccessibilityOptions(): Promise<CatalogItem[]>;
  listSessionLanguages(): Promise<CatalogItem[]>;
  listContentWarnings(): Promise<CatalogItem[]>;
  listSafetyMeasures(): Promise<CatalogItem[]>;
}
