import type { RpgEditionPayload } from '@alcstronghold/directus-payload';
import { createItem, readItems, updateItem } from '@directus/sdk';

import type { ImporterConfig, ImportResult } from '../types';
import { extractErrorMessage, log, normalizeBggId, withRetry } from '../utils';

interface RpgEditionEntity {
  id: string;
  identifier: string;
  translations?: Array<{ id: number; languages_code: string }>;
}

interface RelatedEntity {
  id: string;
  identifier: string;
}

/**
 * RPG Edition importer with FK relationships to rpg_families and rpg_systems.
 */
export class RpgEditionImporter {
  private readonly config: ImporterConfig;
  private result: ImportResult;
  private readonly familyMap: Map<string, string> = new Map(); // identifier -> uuid
  private readonly systemMap: Map<string, string> = new Map(); // identifier -> uuid

  readonly collectionName = 'rpg_editions';
  private readonly languageCodes = ['es-ES', 'ca-ES'] as const;

  constructor(config: ImporterConfig) {
    this.config = config;
    this.result = this.createEmptyResult();
  }

  async import(items: RpgEditionPayload[]): Promise<ImportResult> {
    this.result = this.createEmptyResult();
    this.result.total = items.length;

    log.header(`Importing ${this.collectionName}`);
    log.summary(`Total items: ${items.length}`);

    // Load families and systems for FK lookup
    await Promise.all([
      this.loadFamilies(),
      this.loadSystems(),
    ]);

    // Load existing editions for upsert
    const existingMap = await this.loadExistingEditions();

    for (const item of items) {
      await this.upsertEdition(item, existingMap);
    }

    this.printResult();
    return this.result;
  }

  private async loadFamilies(): Promise<void> {
    try {
      const families = await this.config.client.request<RelatedEntity[]>(
        readItems('rpg_families' as never, {
          limit: -1,
          fields: ['id', 'identifier'] as never,
        })
      );

      for (const family of families) {
        this.familyMap.set(family.identifier, family.id);
      }

      log.info(`Loaded ${this.familyMap.size} rpg_families for FK lookup`);
    } catch (error) {
      log.error('Failed to load rpg_families', error);
    }
  }

  private async loadSystems(): Promise<void> {
    try {
      const systems = await this.config.client.request<RelatedEntity[]>(
        readItems('rpg_systems' as never, {
          limit: -1,
          fields: ['id', 'identifier'] as never,
        })
      );

      for (const system of systems) {
        this.systemMap.set(system.identifier, system.id);
      }

      log.info(`Loaded ${this.systemMap.size} rpg_systems for FK lookup`);
    } catch (error) {
      log.error('Failed to load rpg_systems', error);
    }
  }

  private async loadExistingEditions(): Promise<Map<string, RpgEditionEntity>> {
    const map = new Map<string, RpgEditionEntity>();

    try {
      const existing = await this.config.client.request<RpgEditionEntity[]>(
        readItems('rpg_editions' as never, {
          limit: -1,
          fields: ['id', 'identifier', 'translations.id', 'translations.languages_code'] as never,
        })
      );

      for (const edition of existing) {
        map.set(edition.identifier, edition);
      }

      log.info(`Loaded ${map.size} existing rpg_editions for upsert check`);
    } catch (error) {
      log.error('Failed to load existing rpg_editions', error);
    }

    return map;
  }

  private async upsertEdition(
    payload: RpgEditionPayload,
    existingMap: Map<string, RpgEditionEntity>
  ): Promise<void> {
    const { identifier, name, translations, rpg_family_id, rpg_system_id, bgg_id } = payload;
    const existing = existingMap.get(identifier);

    // Resolve FK identifiers to UUIDs
    const familyUuid = this.familyMap.get(rpg_family_id);
    const systemUuid = rpg_system_id ? this.systemMap.get(rpg_system_id) : null;

    if (!familyUuid) {
      log.warn(`RPG Edition "${identifier}": missing rpg_family: ${rpg_family_id}`);
    }

    if (rpg_system_id && !systemUuid) {
      log.warn(`RPG Edition "${identifier}": missing rpg_system: ${rpg_system_id}`);
    }

    // Normalize bgg_id
    const normalizedBggId = normalizeBggId(bgg_id);

    try {
      if (existing) {
        const request = this.createUpdateRequest(
          identifier,
          name,
          translations,
          familyUuid,
          systemUuid,
          normalizedBggId,
          existing.translations
        );
        await withRetry(
          () =>
            this.config.client.request(
              updateItem('rpg_editions' as never, existing.id as never, request as never)
            ),
          { context: identifier }
        );
        this.result.updated++;
        log.item('updated', identifier);
      } else {
        const request = this.createRequest(
          identifier,
          name,
          translations,
          familyUuid,
          systemUuid,
          normalizedBggId
        );
        await withRetry(
          () =>
            this.config.client.request(createItem('rpg_editions' as never, request as never)),
          { context: identifier }
        );
        this.result.created++;
        log.item('created', identifier);
      }
    } catch (error) {
      const errorMsg = extractErrorMessage(error);
      this.result.failed++;
      this.result.errors.push({ identifier, error: errorMsg });
      log.item('failed', identifier, errorMsg);
    }
  }

  private createRequest(
    identifier: string,
    name: string,
    translations: Record<string, string>,
    familyUuid: string | undefined,
    systemUuid: string | null | undefined,
    bgg_id: number | null
  ): Record<string, unknown> {
    return {
      identifier,
      name,
      status: 'published',
      bgg_id,
      rpg_family_id: familyUuid || null,
      rpg_system_id: systemUuid || null,
      translations: this.languageCodes.map((code) => ({
        languages_code: code,
        name: translations[code] || '',
      })),
    };
  }

  private createUpdateRequest(
    identifier: string,
    name: string,
    translations: Record<string, string>,
    familyUuid: string | undefined,
    systemUuid: string | null | undefined,
    bgg_id: number | null,
    existingTranslations?: Array<{ id: number; languages_code: string }>
  ): Record<string, unknown> {
    const translationIdMap = new Map(
      existingTranslations?.map((t) => [t.languages_code, t.id]) ?? []
    );

    return {
      identifier,
      name,
      status: 'published',
      bgg_id,
      rpg_family_id: familyUuid || null,
      rpg_system_id: systemUuid || null,
      translations: this.languageCodes
        .map((code) => {
          const existingId = translationIdMap.get(code);
          return {
            ...(existingId != null ? { id: existingId } : {}),
            languages_code: code,
            name: translations[code] || '',
          };
        })
        .filter((t) => t.id != null || !translationIdMap.has(t.languages_code)),
    };
  }

  private createEmptyResult(): ImportResult {
    return {
      collection: this.collectionName,
      total: 0,
      created: 0,
      updated: 0,
      failed: 0,
      errors: [],
    };
  }

  private printResult(): void {
    const { created, updated, failed, total } = this.result;
    const success = created + updated;
    const status = failed === 0 ? '✓' : '⚠';

    console.log('');
    log.summary(
      `${status} ${this.collectionName}: ${success}/${total} successful (${created} created, ${updated} updated, ${failed} failed)`
    );
  }
}
