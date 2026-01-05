import type { SettingPayload } from '@alcstronghold/directus-payload';
import { createItem, readItems, updateItem } from '@directus/sdk';

import type { ImporterConfig, ImportResult } from '../types';
import { extractErrorMessage, log, withRetry } from '../utils';

interface SettingEntity {
  id: string;
  identifier: string;
  translations?: Array<{ id: number; languages_code: string }>;
}

interface GenreEntity {
  id: string;
  identifier: string;
}

/**
 * Setting importer with M2M relationship to genres.
 */
export class SettingImporter {
  private readonly config: ImporterConfig;
  private result: ImportResult;
  private readonly genreMap: Map<string, string> = new Map(); // identifier -> uuid

  readonly collectionName = 'settings';
  private readonly languageCodes = ['es-ES', 'ca-ES'] as const;

  constructor(config: ImporterConfig) {
    this.config = config;
    this.result = this.createEmptyResult();
  }

  async import(items: SettingPayload[]): Promise<ImportResult> {
    this.result = this.createEmptyResult();
    this.result.total = items.length;

    log.header(`Importing ${this.collectionName}`);
    log.summary(`Total items: ${items.length}`);

    // Load genres for M2M relationship
    await this.loadGenres();

    // Load existing settings for upsert
    const existingMap = await this.loadExistingSettings();

    for (const item of items) {
      await this.upsertSetting(item, existingMap);
    }

    this.printResult();
    return this.result;
  }

  private async loadGenres(): Promise<void> {
    try {
      const genres = await this.config.client.request<GenreEntity[]>(
        readItems('genres' as never, {
          limit: -1,
          fields: ['id', 'identifier'] as never,
        })
      );

      for (const genre of genres) {
        this.genreMap.set(genre.identifier, genre.id);
      }

      log.info(`Loaded ${this.genreMap.size} genres for M2M lookup`);
    } catch (error) {
      log.error('Failed to load genres', error);
    }
  }

  private async loadExistingSettings(): Promise<Map<string, SettingEntity>> {
    const map = new Map<string, SettingEntity>();

    try {
      const existing = await this.config.client.request<SettingEntity[]>(
        readItems('settings' as never, {
          limit: -1,
          fields: ['id', 'identifier', 'translations.id', 'translations.languages_code'] as never,
        })
      );

      for (const setting of existing) {
        map.set(setting.identifier, setting);
      }

      log.info(`Loaded ${map.size} existing settings for upsert check`);
    } catch (error) {
      log.error('Failed to load existing settings', error);
    }

    return map;
  }

  private async upsertSetting(
    payload: SettingPayload,
    existingMap: Map<string, SettingEntity>
  ): Promise<void> {
    const { identifier, name, translations, genres } = payload;
    const existing = existingMap.get(identifier);

    // Resolve genre identifiers to UUIDs
    const genreIds = genres
      .map((g) => this.genreMap.get(g))
      .filter((id): id is string => id != null);

    if (genreIds.length !== genres.length) {
      const missing = genres.filter((g) => !this.genreMap.has(g));
      log.warn(`Setting "${identifier}": missing genres: ${missing.join(', ')}`);
    }

    try {
      if (existing) {
        const request = this.createUpdateRequest(identifier, name, translations, genreIds, existing.translations);
        await withRetry(
          () =>
            this.config.client.request(
              updateItem('settings' as never, existing.id as never, request as never)
            ),
          { context: identifier }
        );
        this.result.updated++;
        log.item('updated', identifier);
      } else {
        const request = this.createRequest(identifier, name, translations, genreIds);
        await withRetry(
          () =>
            this.config.client.request(createItem('settings' as never, request as never)),
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
    genreIds: string[]
  ): Record<string, unknown> {
    return {
      identifier,
      name,
      status: 'published',
      translations: this.languageCodes.map((code) => ({
        languages_code: code,
        name: translations[code] || '',
      })),
      genres: genreIds.map((id) => ({ genres_id: id })),
    };
  }

  private createUpdateRequest(
    identifier: string,
    name: string,
    translations: Record<string, string>,
    genreIds: string[],
    existingTranslations?: Array<{ id: number; languages_code: string }>
  ): Record<string, unknown> {
    const translationIdMap = new Map(
      existingTranslations
        ?.map((t) => [t.languages_code, t.id]) ?? []
    );

    return {
      identifier,
      name,
      status: 'published',
      translations: this.languageCodes
        .map((code) => {
          const existingId = translationIdMap.get(code);
          return {
            ...(existingId == null ? {} : { id: existingId }),
            languages_code: code,
            name: translations[code] || '',
          };
        })
        .filter((t) => t.id != null || !translationIdMap.has(t.languages_code)),
      genres: genreIds.map((id) => ({ genres_id: id })),
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
