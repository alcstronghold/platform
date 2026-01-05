import type { GenrePayload } from '@alcstronghold/directus-payload';
import { createItem, readItems, updateItem } from '@directus/sdk';

import type { ImporterConfig, ImportResult } from '../types';
import {
  buildNewTranslationRequests,
  buildTranslationRequests,
  extractErrorMessage,
  log,
  printImportResult,
  withRetry,
} from '../utils';

/**
 * Genre entity from Directus
 */
interface GenreEntity {
  id: string;
  identifier: string;
  parent_id: string | null;
}

/**
 * Genre with translations for existing entity lookup
 */
interface GenreWithTranslations extends GenreEntity {
  translations?: Array<{ id: number; languages_code: string }>;
}

/**
 * Map of identifier -> Directus UUID
 */
type GenreMap = Map<string, string>;

/**
 * Genre importer with multi-pass support for hierarchical parent relationships.
 *
 * Genres can have parent_id references to other genres, which creates a dependency tree.
 * This importer processes genres in multiple passes:
 * - Pass 1: Genres without a parent (root level)
 * - Pass 2: Genres whose parent was processed in pass 1
 * - Pass N: Genres whose parent was processed in pass N-1
 *
 * This ensures parents exist before their children are imported.
 */
export class GenreImporter {
  private readonly config: ImporterConfig;
  private result: ImportResult;
  private readonly genreMap: GenreMap = new Map();

  readonly collectionName = 'genres';
  private readonly languageCodes = ['es-ES', 'ca-ES'] as const;

  constructor(config: ImporterConfig) {
    this.config = config;
    this.result = this.createEmptyResult();
  }

  /**
   * Import genres using multi-pass algorithm
   */
  async import(items: GenrePayload[]): Promise<ImportResult> {
    this.result = this.createEmptyResult();
    this.result.total = items.length;

    log.header(`Importing ${this.collectionName} (hierarchical)`);
    log.summary(`Total items: ${items.length}`);

    // Load existing genres to support incremental imports
    await this.loadExistingGenres();

    // Process passes until all are done or stuck
    let pending = [...items];
    let passNumber = 1;
    const maxPasses = 20; // Safety limit

    while (pending.length > 0 && passNumber <= maxPasses) {
      log.pass(passNumber, pending.length);

      // Get genres that can be processed (no parent, or parent already exists)
      const processable = this.getProcessableGenres(pending);

      if (processable.length === 0) {
        this.logUnresolvedDependencies(pending);
        break;
      }

      // Process this batch
      const processed = await this.processBatch(processable);

      if (processed.size === 0) {
        log.error('Loop detected: no genres processed despite having candidates');
        break;
      }

      // Remove processed from pending
      pending = pending.filter((g) => !processed.has(g.identifier));
      passNumber++;
    }

    this.printResult();
    return this.result;
  }

  /**
   * Load existing genres into the map for upsert logic
   */
  private async loadExistingGenres(): Promise<void> {
    try {
      const existing = await this.config.client.request<GenreEntity[]>(
        readItems('genres' as never, {
          limit: -1,
          fields: ['id', 'identifier'] as never,
        }),
      );

      for (const genre of existing) {
        this.genreMap.set(genre.identifier, genre.id);
      }

      log.info(`Loaded ${this.genreMap.size} existing genres for upsert check`);
    } catch (error) {
      log.error('Failed to load existing genres', error);
    }
  }

  /**
   * Get genres whose parent dependency is satisfied
   */
  private getProcessableGenres(pending: GenrePayload[]): GenrePayload[] {
    return pending.filter((g) => {
      // No parent = can always be processed
      if (g.parent == null) return true;
      // Parent exists in our map = can be processed
      return this.genreMap.has(g.parent);
    });
  }

  /**
   * Process a batch of genres
   */
  private async processBatch(batch: GenrePayload[]): Promise<Set<string>> {
    const processed = new Set<string>();

    for (const payload of batch) {
      const success = await this.upsertGenre(payload);
      if (success) {
        processed.add(payload.identifier);
      }
    }

    return processed;
  }

  /**
   * Upsert a single genre
   */
  private async upsertGenre(payload: GenrePayload): Promise<boolean> {
    const { identifier, name, translations, parent } = payload;
    const parentId = parent == null ? undefined : this.genreMap.get(parent);

    try {
      // Check if already exists
      const existing = await this.findExistingGenre(identifier);

      if (existing) {
        const request = this.createUpdateRequest(identifier, name, parentId, translations, existing.translations);
        await withRetry(
          () =>
            this.config.client.request(
              updateItem('genres' as never, existing.id as never, request as never),
            ),
          { context: identifier },
        );
        this.result.updated++;
        log.item('updated', identifier);
      } else {
        const request = this.createRequest(identifier, name, parentId, translations);
        const created = await withRetry(
          () =>
            this.config.client.request(createItem('genres' as never, request as never)),
          { context: identifier },
        );
        // For children, add to a map during later stages
        this.genreMap.set(identifier, (created as unknown as { id: string }).id);
        this.result.created++;
        log.item('created', identifier);
      }

      return true;
    } catch (error) {
      const errorMsg = extractErrorMessage(error);
      this.result.failed++;
      this.result.errors.push({ identifier, error: errorMsg });
      log.item('failed', identifier, errorMsg);
      return false;
    }
  }

  /**
   * Find an existing genre with its translations
   */
  private async findExistingGenre(identifier: string): Promise<GenreWithTranslations | null> {
    try {
      const results = await this.config.client.request<GenreWithTranslations[]>(
        readItems('genres' as never, {
          filter: { identifier: { _eq: identifier } } as never,
          limit: 1,
          fields: ['id', 'identifier', 'translations.id', 'translations.languages_code'] as never,
        }),
      );
      return results.length > 0 ? results[0] : null;
    } catch {
      return null;
    }
  }

  /**
   * Create request for new genre
   */
  private createRequest(
    identifier: string,
    name: string,
    parentId: string | undefined,
    translations: Record<string, string>,
  ): Record<string, unknown> {
    return {
      identifier,
      name,
      parent_id: parentId ?? null,
      status: 'published',
      translations: buildNewTranslationRequests(this.languageCodes, translations),
    };
  }

  /**
   * Create request for updating existing genre (preserves translation IDs)
   */
  private createUpdateRequest(
    identifier: string,
    name: string,
    parentId: string | undefined,
    translations: Record<string, string>,
    existingTranslations?: Array<{ id: number; languages_code: string }>,
  ): Record<string, unknown> {
    return {
      identifier,
      name,
      parent_id: parentId ?? null,
      status: 'published',
      translations: buildTranslationRequests(this.languageCodes, translations, existingTranslations ?? []),
    };
  }

  /**
   * Log genres with unresolved parent dependencies
   */
  private logUnresolvedDependencies(pending: GenrePayload[]): void {
    log.error('Unresolved dependencies. The following genres have unknown parents:');
    for (const g of pending) {
      log.warn(`  - "${g.identifier}" requires parent: "${g.parent}"`);
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
    printImportResult(this.result);
  }
}
