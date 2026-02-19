import type {
  CatalogItem,
  CatalogPort,
  GenreCatalog,
  RpgEditionCatalog,
  RpgFamilyCatalog,
  RpgSystemCatalog,
  SettingCatalog,
} from '@alcstronghold/domain';
import { customEndpoint } from '@directus/sdk';

import type { DirectusAuthClient } from './client.js';

interface DirectusTranslation {
  languages_code: string;
  name?: string;
}

interface DirectusCatalogItem {
  id: string;
  identifier: string;
  translations: DirectusTranslation[];
}

interface DirectusGenre extends DirectusCatalogItem {
  parent_id: string | null;
}

interface DirectusRpgFamily extends DirectusCatalogItem {
  settings: { settings_id: string }[];
}

interface DirectusRpgEdition extends DirectusCatalogItem {
  rpg_family_id: string | null;
  rpg_system_id: string | null;
}

interface DirectusSetting extends DirectusCatalogItem {
  genres: { genres_id: string }[];
  rpg_families: { rpg_families_id: string }[];
}

/**
 * Resuelve el nombre traducido, priorizando el locale indicado
 */
function resolveTranslation(
  translations: DirectusTranslation[] | undefined,
  locale = 'es-ES',
): string {
  if (!translations?.length) return '';
  const match = translations.find(t => t.languages_code === locale);
  return (match ?? translations[0])?.name ?? '';
}

function toCatalogItem(item: DirectusCatalogItem): CatalogItem {
  return {
    id: item.id,
    identifier: item.identifier,
    name: resolveTranslation(item.translations),
  };
}

const CATALOG_FIELDS = ['id', 'identifier', 'translations.languages_code', 'translations.name'];
const CATALOG_FILTER = { status: { _eq: 'published' } };
const CATALOG_LIMIT = -1; // Traer todos sin paginación (Directus default: 100)

/**
 * Adapter de Directus para lectura de catálogos de referencia.
 * Implementa CatalogPort usando customEndpoint del Directus SDK.
 * Resuelve traducciones a es-ES por defecto.
 *
 * Se usa customEndpoint en lugar de readItems porque el SDK
 * de Directus tipea las colecciones custom como `never` cuando no hay
 * schema definido, lo que causa errores con el compilador de Angular.
 */
export class DirectusCatalogAdapter implements CatalogPort {
  constructor(private readonly client: DirectusAuthClient) {}

  async listRpgFamilies(): Promise<RpgFamilyCatalog[]> {
    const items = await this.client.request<DirectusRpgFamily[]>(
      customEndpoint<DirectusRpgFamily[]>({
        path: '/items/rpg_families',
        params: {
          fields: [...CATALOG_FIELDS, 'settings.settings_id'],
          filter: CATALOG_FILTER,
          limit: CATALOG_LIMIT,
          sort: ['sort'],
        },
      })
    );

    return items.map(item => ({
      ...toCatalogItem(item),
      settingIds: (item.settings ?? []).map(s => s.settings_id),
    }));
  }

  async listRpgEditions(): Promise<RpgEditionCatalog[]> {
    const items = await this.client.request<DirectusRpgEdition[]>(
      customEndpoint<DirectusRpgEdition[]>({
        path: '/items/rpg_editions',
        params: {
          fields: [...CATALOG_FIELDS, 'rpg_family_id', 'rpg_system_id'],
          filter: CATALOG_FILTER,
          limit: CATALOG_LIMIT,
          sort: ['sort'],
        },
      })
    );

    return items.map(item => ({
      ...toCatalogItem(item),
      rpgFamilyId: item.rpg_family_id,
      rpgSystemId: item.rpg_system_id,
    }));
  }

  async listRpgSystems(): Promise<RpgSystemCatalog[]> {
    const items = await this.client.request<DirectusCatalogItem[]>(
      customEndpoint<DirectusCatalogItem[]>({
        path: '/items/rpg_systems',
        params: {
          fields: CATALOG_FIELDS,
          filter: CATALOG_FILTER,
          limit: CATALOG_LIMIT,
          sort: ['sort'],
        },
      })
    );

    return items.map(toCatalogItem);
  }

  async listSettings(): Promise<SettingCatalog[]> {
    const items = await this.client.request<DirectusSetting[]>(
      customEndpoint<DirectusSetting[]>({
        path: '/items/settings',
        params: {
          fields: [...CATALOG_FIELDS, 'genres.genres_id', 'rpg_families.rpg_families_id'],
          filter: CATALOG_FILTER,
          limit: CATALOG_LIMIT,
          sort: ['sort'],
        },
      })
    );

    return items.map(item => ({
      ...toCatalogItem(item),
      genreIds: (item.genres ?? []).map(g => g.genres_id),
      rpgFamilyIds: (item.rpg_families ?? []).map(f => f.rpg_families_id),
    }));
  }

  async listGenres(): Promise<GenreCatalog[]> {
    const items = await this.client.request<DirectusGenre[]>(
      customEndpoint<DirectusGenre[]>({
        path: '/items/genres',
        params: {
          fields: [...CATALOG_FIELDS, 'parent_id'],
          filter: CATALOG_FILTER,
          limit: CATALOG_LIMIT,
          sort: ['sort'],
        },
      })
    );

    return items.map(item => ({
      ...toCatalogItem(item),
      parentId: item.parent_id,
    }));
  }

  async listAgeRanges(): Promise<CatalogItem[]> {
    return this.listSimpleCatalog('age_ranges');
  }

  async listKnowledgeLevels(): Promise<CatalogItem[]> {
    return this.listSimpleCatalog('knowledge_levels');
  }

  async listAccessibilityOptions(): Promise<CatalogItem[]> {
    return this.listSimpleCatalog('accessibility_options');
  }

  async listSessionLanguages(): Promise<CatalogItem[]> {
    return this.listSimpleCatalog('session_languages');
  }

  async listContentWarnings(): Promise<CatalogItem[]> {
    return this.listSimpleCatalog('content_warnings');
  }

  async listSafetyMeasures(): Promise<CatalogItem[]> {
    return this.listSimpleCatalog('safety_measures');
  }

  /**
   * Lee una colección de catálogo simple (solo id, identifier, translations)
   */
  private async listSimpleCatalog(collection: string): Promise<CatalogItem[]> {
    const items = await this.client.request<DirectusCatalogItem[]>(
      customEndpoint<DirectusCatalogItem[]>({
        path: `/items/${collection}`,
        params: {
          fields: CATALOG_FIELDS,
          filter: CATALOG_FILTER,
          limit: CATALOG_LIMIT,
          sort: ['sort'],
        },
      })
    );

    return items.map(toCatalogItem);
  }
}
