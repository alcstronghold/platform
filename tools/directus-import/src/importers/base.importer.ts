import { createItem, readItems, updateItem } from '@directus/sdk';

import type { ImporterConfig, ImportResult } from '../types';
import { extractErrorMessage, log, withRetry } from '../utils';

export type { ImporterConfig, ImportResult };

/**
 * Base class for collection importers.
 * Provides generic upsert functionality with proper error handling.
 *
 * @template TPayload - The type of the payload from JSON files
 * @template TEntity - The type of the Directus entity
 */
export abstract class BaseImporter<TPayload, TEntity extends { id: string }> {
  protected config: ImporterConfig;
  protected result: ImportResult;

  /** The Directus collection name */
  abstract readonly collectionName: string;

  /** The field used as unique identifier for upsert */
  abstract readonly identifierField: keyof TPayload & keyof TEntity & string;

  constructor(config: ImporterConfig) {
    this.config = config;
    this.result = this.createEmptyResult();
  }

  /**
   * Transform a payload item to Directus request format.
   * Override this to handle translations and relationships.
   */
  protected abstract toDirectusRequest(
    payload: TPayload,
    existingEntity?: TEntity
  ): Record<string, unknown>;

  /**
   * Get the identifier value from a payload item
   */
  protected getIdentifier(payload: TPayload): string {
    return String(payload[this.identifierField]);
  }

  /**
   * Fields to fetch when loading existing entities.
   * Override to include translation fields for update.
   */
  protected getExistingEntityFields(): string[] {
    return ['id', this.identifierField];
  }

  /**
   * Import all items from the payload array
   */
  async import(items: TPayload[]): Promise<ImportResult> {
    this.result = this.createEmptyResult();
    this.result.total = items.length;

    log.header(`Importing ${this.collectionName}`);
    log.summary(`Total items: ${items.length}`);

    // Load existing entities for upsert logic
    const existingMap = await this.loadExistingEntities();

    for (const item of items) {
      await this.upsertItem(item, existingMap);
    }

    this.printResult();
    return this.result;
  }

  /**
   * Load all existing entities into a map for fast lookup
   */
  protected async loadExistingEntities(): Promise<Map<string, TEntity>> {
    const map = new Map<string, TEntity>();

    try {
      const existing = await this.config.client.request<TEntity[]>(
        readItems(this.collectionName as never, {
          limit: -1,
          fields: this.getExistingEntityFields() as never,
        })
      );

      for (const entity of existing) {
        const key = String(entity[this.identifierField as keyof TEntity]);
        map.set(key, entity);
      }

      log.info(`Loaded ${map.size} existing ${this.collectionName} for upsert check`);
    } catch (error) {
      log.error(`Failed to load existing ${this.collectionName}`, error);
    }

    return map;
  }

  /**
   * Upsert a single item (create or update based on existence)
   */
  protected async upsertItem(payload: TPayload, existingMap: Map<string, TEntity>): Promise<void> {
    const identifier = this.getIdentifier(payload);
    const existing = existingMap.get(identifier);

    try {
      const request = {
        status: 'published',
        ...this.toDirectusRequest(payload, existing),
      };

      if (existing) {
        await withRetry(
          () =>
            this.config.client.request(
              updateItem(this.collectionName as never, existing.id as never, request as never)
            ),
          { context: identifier }
        );
        this.result.updated++;
        log.item('updated', identifier);
      } else {
        const created = await withRetry(
          () =>
            this.config.client.request(
              createItem(this.collectionName as never, request as never)
            ),
          { context: identifier }
        );
        // Add to the map for subsequent items that might reference this one
        existingMap.set(identifier, created as unknown as TEntity);
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

  /**
   * Create an empty result object
   */
  protected createEmptyResult(): ImportResult {
    return {
      collection: this.collectionName,
      total: 0,
      created: 0,
      updated: 0,
      failed: 0,
      errors: [],
    };
  }

  /**
   * Print the final result summary
   */
  protected printResult(): void {
    const { created, updated, failed, total } = this.result;
    const success = created + updated;
    const status = failed === 0 ? '✓' : '⚠';

    console.log('');
    log.summary(
      `${status} ${this.collectionName}: ${success}/${total} successful (${created} created, ${updated} updated, ${failed} failed)`
    );

    if (this.result.errors.length > 0 && this.result.errors.length <= 5) {
      this.result.errors.forEach(({ identifier, error }) => {
        log.error(`  "${identifier}": ${error}`);
      });
    } else if (this.result.errors.length > 5) {
      log.error(`  First 5 of ${this.result.errors.length} errors:`);
      this.result.errors.slice(0, 5).forEach(({ identifier, error }) => {
        log.error(`  "${identifier}": ${error}`);
      });
    }
  }
}

/**
 * Base class for importers that handle translations.
 * Provides helper methods for handling a Directus translations pattern.
 */
export abstract class TranslatableImporter<
  TPayload extends { translations: Record<string, string> },
  TEntity extends { id: string; translations?: unknown[] }
> extends BaseImporter<TPayload, TEntity> {
  /**
   * Supported language codes
   */
  protected readonly languageCodes = ['es-ES', 'ca-ES'] as const;

  /**
   * Create translation objects for a new entity
   */
  protected createTranslations(
    translations: Record<string, string>
  ): Array<{ languages_code: string; name: string }> {
    return this.languageCodes.map((code) => ({
      languages_code: code,
      name: translations[code] || '',
    }));
  }

  /**
   * Update translation objects for an existing entity.
   * Preserves translation IDs to avoid creating duplicates.
   */
  protected updateTranslations(
    translations: Record<string, string>,
    existingTranslations?: Array<{ id?: number; languages_code: string }>
  ): Array<{ id?: number; languages_code: string; name: string }> {
    const idMap = new Map(
      existingTranslations?.map((t) => [t.languages_code, t.id]) ?? []
    );

    return this.languageCodes.map((code) => {
      const existing = idMap.get(code);
      return {
        ...(existing != null ? { id: existing } : {}),
        languages_code: code,
        name: translations[code] || '',
      };
    });
  }

  /**
   * Override to include translation fields
   */
  protected getExistingEntityFields(): string[] {
    return ['id', this.identifierField, 'translations.id', 'translations.languages_code'];
  }
}
