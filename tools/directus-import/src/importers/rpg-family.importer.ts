import type { RpgFamilyPayload } from '@alcstronghold/directus-payload';
import { createItem, readItems, updateItem } from '@directus/sdk';

import type { ImporterConfig, ImportResult } from '../types';
import { extractErrorMessage, log, withRetry } from '../utils';

interface RpgFamilyEntity {
  id: string;
  identifier: string;
  translations?: Array<{ id: number; languages_code: string }>;
}

interface SettingEntity {
  id: string;
  identifier: string;
}

/**
 * RPG Family importer with M2M relationship to settings.
 */
export class RpgFamilyImporter {
  private readonly config: ImporterConfig;
  private result: ImportResult;
  private readonly settingMap: Map<string, string> = new Map(); // identifier -> uuid

  readonly collectionName = 'rpg_families';
  private readonly languageCodes = ['es-ES', 'ca-ES'] as const;

  constructor(config: ImporterConfig) {
    this.config = config;
    this.result = this.createEmptyResult();
  }

  async import(items: RpgFamilyPayload[]): Promise<ImportResult> {
    this.result = this.createEmptyResult();
    this.result.total = items.length;

    log.header(`Importing ${this.collectionName}`);
    log.summary(`Total items: ${items.length}`);

    // Load settings for M2M relationship
    await this.loadSettings();

    // Load existing families for upsert
    const existingMap = await this.loadExistingFamilies();

    for (const item of items) {
      await this.upsertFamily(item, existingMap);
    }

    this.printResult();
    return this.result;
  }

  private async loadSettings(): Promise<void> {
    try {
      const settings = await this.config.client.request<SettingEntity[]>(
        readItems('settings' as never, {
          limit: -1,
          fields: ['id', 'identifier'] as never,
        })
      );

      for (const setting of settings) {
        this.settingMap.set(setting.identifier, setting.id);
      }

      log.info(`Loaded ${this.settingMap.size} settings for M2M lookup`);
    } catch (error) {
      log.error('Failed to load settings', error);
    }
  }

  private async loadExistingFamilies(): Promise<Map<string, RpgFamilyEntity>> {
    const map = new Map<string, RpgFamilyEntity>();

    try {
      const existing = await this.config.client.request<RpgFamilyEntity[]>(
        readItems('rpg_families' as never, {
          limit: -1,
          fields: ['id', 'identifier', 'translations.id', 'translations.languages_code'] as never,
        })
      );

      for (const family of existing) {
        map.set(family.identifier, family);
      }

      log.info(`Loaded ${map.size} existing rpg_families for upsert check`);
    } catch (error) {
      log.error('Failed to load existing rpg_families', error);
    }

    return map;
  }

  private async upsertFamily(
    payload: RpgFamilyPayload,
    existingMap: Map<string, RpgFamilyEntity>
  ): Promise<void> {
    const { identifier, name, translations, settings } = payload;
    const existing = existingMap.get(identifier);

    // Resolve setting identifiers to UUIDs
    const settingIds = settings
      .map((s) => this.settingMap.get(s))
      .filter((id): id is string => id != null);

    if (settingIds.length !== settings.length) {
      const missing = settings.filter((s) => !this.settingMap.has(s));
      log.warn(`RPG Family "${identifier}": missing settings: ${missing.join(', ')}`);
    }

    try {
      if (existing) {
        const request = this.createUpdateRequest(identifier, name, translations, settingIds, existing.translations);
        await withRetry(
          () =>
            this.config.client.request(
              updateItem('rpg_families' as never, existing.id as never, request as never)
            ),
          { context: identifier }
        );
        this.result.updated++;
        log.item('updated', identifier);
      } else {
        const request = this.createRequest(identifier, name, translations, settingIds);
        await withRetry(
          () =>
            this.config.client.request(createItem('rpg_families' as never, request as never)),
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
    settingIds: string[]
  ): Record<string, unknown> {
    return {
      identifier,
      name,
      status: 'published',
      translations: this.languageCodes
        .map((code) => ({
        languages_code: code,
        name: translations[code] || '',
      })),
      settings: settingIds.map((id) => ({ settings_id: id })),
    };
  }

  private createUpdateRequest(
    identifier: string,
    name: string,
    translations: Record<string, string>,
    settingIds: string[],
    existingTranslations?: Array<{ id: number; languages_code: string }>
  ): Record<string, unknown> {
    const translationIdMap = new Map(
      existingTranslations?.map((t) => [t.languages_code, t.id]) ?? []
    );

    return {
      identifier,
      name,
      status: 'published',
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
      settings: settingIds.map((id) => ({ settings_id: id })),
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
