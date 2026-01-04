import type { RpgSystemPayload } from '@alcstronghold/directus-payload';
import type { LanguageCodes } from '@alcstronghold/directus-schema';
import { readItems } from '@directus/sdk';

import type {
  ExporterConfig,
  ExportResult,
  RpgSystemEntity,
  RpgSystemTranslation,
} from '../types';
import { extractErrorMessage, log } from '../utils';
import { LANGUAGE_CODES } from './base.exporter';

export class RpgSystemExporter {
  private readonly config: ExporterConfig;
  readonly collectionName = 'rpg_systems';

  constructor(config: ExporterConfig) {
    this.config = config;
  }

  async export(): Promise<{ data: RpgSystemPayload[]; result: ExportResult }> {
    log.header(`Exporting ${this.collectionName}`);

    const result: ExportResult = {
      collection: this.collectionName,
      total: 0,
      errors: [],
    };

    try {
      const entities = await this.config.client.request<RpgSystemEntity[]>(
        readItems('rpg_systems' as never, {
          limit: -1,
          fields: [
            'identifier',
            'name',
            'bgg_id',
            'translations.languages_code',
            'translations.name',
          ] as never,
          sort: ['identifier'] as never,
        })
      );

      const data: RpgSystemPayload[] = entities.map((entity) => ({
        identifier: entity.identifier,
        name: entity.name,
        bgg_id: entity.bgg_id,
        translations: this.buildTranslations(entity.translations),
      }));

      result.total = data.length;
      log.success(`Exported ${data.length} rpg_systems`);

      return { data, result };
    } catch (error) {
      const msg = extractErrorMessage(error);
      result.errors.push(msg);
      log.error(`Failed to export rpg_systems: ${msg}`);
      return { data: [], result };
    }
  }

  private buildTranslations(translations: RpgSystemTranslation[]): Record<LanguageCodes, string> {
    const result = {} as Record<LanguageCodes, string>;

    for (const code of LANGUAGE_CODES) {
      const translation = translations.find((t) => t.languages_code === code);
      result[code] = translation?.name ?? '';
    }

    return result;
  }
}
