import type { RpgSystemPayload } from '@alcstronghold/directus-payload';
import { createItem, readItems, updateItem } from '@directus/sdk';

import type { ImporterConfig, ImportResult } from '../types';
import {
  buildNewTranslationRequests,
  buildTranslationRequests,
  extractErrorMessage,
  log,
  normalizeBggId,
  withRetry,
} from '../utils';

interface RpgSystemEntity {
  id: string;
  identifier: string;
  translations?: Array<{ id: number; languages_code: string }>;
}

/**
 * RPG System importer - the simple collection with translations and bgg_id.
 */
export class RpgSystemImporter {
  private readonly config: ImporterConfig;
  private result: ImportResult;

  readonly collectionName = 'rpg_systems';
  private readonly languageCodes = ['es-ES', 'ca-ES'] as const;

  constructor(config: ImporterConfig) {
    this.config = config;
    this.result = this.createEmptyResult();
  }

  async import(items: RpgSystemPayload[]): Promise<ImportResult> {
    this.result = this.createEmptyResult();
    this.result.total = items.length;

    log.header(`Importing ${this.collectionName}`);
    log.summary(`Total items: ${items.length}`);

    // Load existing systems for upsert
    const existingMap = await this.loadExistingSystems();

    for (const item of items) {
      await this.upsertSystem(item, existingMap);
    }

    this.printResult();
    return this.result;
  }

  private async loadExistingSystems(): Promise<Map<string, RpgSystemEntity>> {
    const map = new Map<string, RpgSystemEntity>();

    try {
      const existing = await this.config.client.request<RpgSystemEntity[]>(
        readItems('rpg_systems' as never, {
          limit: -1,
          fields: ['id', 'identifier', 'translations.id', 'translations.languages_code'] as never,
        })
      );

      for (const system of existing) {
        map.set(system.identifier, system);
      }

      log.info(`Loaded ${map.size} existing rpg_systems for upsert check`);
    } catch (error) {
      log.error('Failed to load existing rpg_systems', error);
    }

    return map;
  }

  private async upsertSystem(
    payload: RpgSystemPayload,
    existingMap: Map<string, RpgSystemEntity>
  ): Promise<void> {
    const { identifier, translations, bgg_id } = payload;
    const existing = existingMap.get(identifier);

    // Normalize bgg_id: convert string to number, handle null
    const normalizedBggId = normalizeBggId(bgg_id);

    try {
      if (existing) {
        const request = this.createUpdateRequest(identifier, translations, normalizedBggId, existing.translations);
        await withRetry(
          () =>
            this.config.client.request(
              updateItem('rpg_systems' as never, existing.id as never, request as never)
            ),
          { context: identifier }
        );
        this.result.updated++;
        log.item('updated', identifier);
      } else {
        const request = this.createRequest(identifier, translations, normalizedBggId);
        await withRetry(
          () =>
            this.config.client.request(createItem('rpg_systems' as never, request as never)),
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
    translations: Record<string, string>,
    bgg_id: number | null
  ): Record<string, unknown> {
    return {
      identifier,
      status: 'published',
      bgg_id,
      translations: buildNewTranslationRequests(this.languageCodes, translations),
    };
  }

  private createUpdateRequest(
    identifier: string,
    translations: Record<string, string>,
    bgg_id: number | null,
    existingTranslations?: Array<{ id: number; languages_code: string }>
  ): Record<string, unknown> {
    return {
      identifier,
      status: 'published',
      bgg_id,
      translations: buildTranslationRequests(this.languageCodes, translations, existingTranslations ?? []),
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
