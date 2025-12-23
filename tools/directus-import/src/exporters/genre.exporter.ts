import type { GenrePayload } from '@alcstronghold/directus-payload';
import { readItems } from '@directus/sdk';

import { extractErrorMessage, log } from '../utils';
import type { ExporterConfig, ExportResult, LanguageCodes } from './base.exporter';
import { LANGUAGE_CODES } from './base.exporter';

interface GenreTranslation {
  languages_code: string;
  name: string;
}

interface GenreEntity {
  id: string;
  identifier: string;
  name: string;
  parent_id: string | null | { id: string; identifier: string };
  translations: GenreTranslation[];
}

export class GenreExporter {
  private readonly config: ExporterConfig;
  readonly collectionName = 'genres';
  private identifierMap: Map<string, string> = new Map(); // id -> identifier

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

      const data: GenrePayload[] = entities.map((entity) => {
        const translations = this.buildTranslations(entity.translations);
        const parentIdentifier = this.resolveParentIdentifier(entity.parent_id);

        const payload: GenrePayload = {
          identifier: entity.identifier,
          name: entity.name,
          translations,
        };

        if (parentIdentifier) {
          payload.parent = parentIdentifier;
        }

        return payload;
      });

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

  private resolveParentIdentifier(parentId: string | null | { id: string; identifier: string }): string | undefined {
    if (!parentId) return undefined;

    // If it's an object (populated relation), use identifier directly
    if (typeof parentId === 'object') {
      return parentId.identifier;
    }

    // Otherwise look up by ID
    return this.identifierMap.get(parentId);
  }
}
