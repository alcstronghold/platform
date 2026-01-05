import type { GenrePayload } from '@alcstronghold/directus-payload';
import type { LanguageCodes } from '@alcstronghold/directus-schema';
import { readItems } from '@directus/sdk';

import type { ExporterConfig, ExportResult, GenreEntity, GenreTranslation } from '../types';
import { extractErrorMessage, log } from '../utils';
import { LANGUAGE_CODES } from './base.exporter';

export class GenreExporter {
  private readonly config: ExporterConfig;
  readonly collectionName = 'genres';
  private readonly identifierMap: Map<string, string> = new Map(); // id -> identifier

  constructor(config: ExporterConfig) {
    this.config = config;
  }

  async export(): Promise<{ data: GenrePayload[]; result: ExportResult }> {
    log.header(`Exporting ${this.collectionName}`);

    const result: ExportResult = {
      collection: this.collectionName,
      total: 0,
      errors: [],
    };

    try {
      const entities = await this.config.client.request<GenreEntity[]>(
        readItems('genres' as never, {
          limit: -1,
          fields: ['id', 'identifier', 'name', 'parent_id', 'translations.languages_code', 'translations.name'] as never,
          sort: ['identifier'] as never,
        })
      );

      // Build id -> identifier map for parent resolution
      for (const entity of entities) {
        this.identifierMap.set(entity.id, entity.identifier);
      }

      const data: GenrePayload[] = entities.map((entity) => ({
        identifier: entity.identifier,
        name: entity.name,
        parent: this.resolveParentIdentifier(entity.parent_id),
        translations: this.buildTranslations(entity.translations),
      }));

      result.total = data.length;
      log.success(`Exported ${data.length} genres`);

      return { data, result };
    } catch (error) {
      const msg = extractErrorMessage(error);
      result.errors.push(msg);
      log.error(`Failed to export genres: ${msg}`);
      return { data: [], result };
    }
  }

  private buildTranslations(translations: GenreTranslation[]): Record<LanguageCodes, string> {
    const result = {} as Record<LanguageCodes, string>;

    for (const code of LANGUAGE_CODES) {
      const translation = translations.find((t) => t.languages_code === code);
      result[code] = translation?.name ?? '';
    }

    return result;
  }

  private resolveParentIdentifier(parentId: string | null | { id: string; identifier: string }): string | null {
    if (!parentId) return null;

    // If it's an object (populated relation), use identifier directly
    if (typeof parentId === 'object') {
      return parentId.identifier;
    }

    // Otherwise look up by ID
    return this.identifierMap.get(parentId) ?? null;
  }
}
