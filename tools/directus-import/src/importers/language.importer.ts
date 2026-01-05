import type { LanguagePayload } from '@alcstronghold/directus-payload';
import { createItem, readItems, updateItem } from '@directus/sdk';

import type { ImporterConfig, ImportResult } from '../types';
import { extractErrorMessage, log, withRetry } from '../utils';

interface LanguageEntity {
  code: string;
  name: string;
  direction: string;
}

/**
 * Language importer.
 * Languages use `code` as the primary key (not `id`), so this importer
 * handles the special case where the identifier IS the primary key.
 */
export class LanguageImporter {
  private readonly config: ImporterConfig;
  private result: ImportResult;

  readonly collectionName = 'languages';


  constructor(config: ImporterConfig) {
    this.config = config;
    this.result = this.createEmptyResult();
  }

  async import(items: LanguagePayload[]): Promise<ImportResult> {
    this.result = this.createEmptyResult();
    this.result.total = items.length;

    log.header(`Importing ${this.collectionName}`);
    log.summary(`Total items: ${items.length}`);

    // Load existing languages for upsert
    const existingMap = await this.loadExistingLanguages();

    for (const item of items) {
      await this.upsertLanguage(item, existingMap);
    }

    this.printResult();
    return this.result;
  }

  private async loadExistingLanguages(): Promise<Map<string, LanguageEntity>> {
    const map = new Map<string, LanguageEntity>();

    try {
      const existing = await this.config.client.request<LanguageEntity[]>(
        readItems('languages' as never, {
          limit: -1,
          fields: ['code', 'name', 'direction'] as never,
        })
      );

      for (const lang of existing) {
        map.set(lang.code, lang);
      }

      log.info(`Loaded ${map.size} existing languages for upsert check`);
    } catch (error) {
      log.error('Failed to load existing languages', error);
    }

    return map;
  }

  private async upsertLanguage(
    payload: LanguagePayload,
    existingMap: Map<string, LanguageEntity>
  ): Promise<void> {
    const { code, name, direction } = payload;
    const existing = existingMap.get(code);

    try {
      if (existing) {
        // Update using code as the primary key
        await withRetry(
          () =>
            this.config.client.request(
              updateItem('languages' as never, code as never, {
                name,
                direction,
              } as never)
            ),
          { context: code }
        );
        this.result.updated++;
        log.item('updated', code);
      } else {
        await withRetry(
          () =>
            this.config.client.request(
              createItem('languages' as never, {
                code,
                name,
                direction,
              } as never)
            ),
          { context: code }
        );
        this.result.created++;
        log.item('created', code);
      }
    } catch (error) {
      const errorMsg = extractErrorMessage(error);
      this.result.failed++;
      this.result.errors.push({ identifier: code, error: errorMsg });
      log.item('failed', code, errorMsg);
    }
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
