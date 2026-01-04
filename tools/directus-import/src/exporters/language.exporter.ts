import type { LanguagePayload } from '@alcstronghold/directus-payload';
import type { Language } from '@alcstronghold/directus-schema';
import { readItems } from '@directus/sdk';

import type { ExporterConfig, ExportResult } from '../types';
import { extractErrorMessage, log } from '../utils';

export class LanguageExporter {
  private readonly config: ExporterConfig;
  readonly collectionName = 'languages';

  constructor(config: ExporterConfig) {
    this.config = config;
  }

  async export(): Promise<{ data: LanguagePayload[]; result: ExportResult }> {
    log.header(`Exporting ${this.collectionName}`);

    const result: ExportResult = {
      collection: this.collectionName,
      total: 0,
      errors: [],
    };

    try {
      const entities = await this.config.client.request<Language[]>(
        readItems('languages' as never, {
          limit: -1,
          fields: ['code', 'name', 'direction'] as never,
        })
      );

      const data: LanguagePayload[] = entities.map((entity) => ({
        code: entity.code,
        name: entity.name,
        direction: entity.direction,
      }));

      result.total = data.length;
      log.success(`Exported ${data.length} languages`);

      return { data, result };
    } catch (error) {
      const msg = extractErrorMessage(error);
      result.errors.push(msg);
      log.error(`Failed to export languages: ${msg}`);
      return { data: [], result };
    }
  }
}
