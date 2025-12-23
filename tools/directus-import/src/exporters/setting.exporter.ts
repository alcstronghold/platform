import type { SettingPayload } from '@alcstronghold/directus-payload';
import { readItems } from '@directus/sdk';

import { extractErrorMessage, log } from '../utils';
import type { ExporterConfig, ExportResult, LanguageCodes } from './base.exporter';
import { LANGUAGE_CODES } from './base.exporter';

interface SettingTranslation {
  languages_code: string;
  name: string;
}

interface GenreRelation {
  genres_id: string | { id: string; identifier: string };
}

interface SettingEntity {
  identifier: string;
  name: string;
  translations: SettingTranslation[];
  genres: GenreRelation[];
}

export class SettingExporter {
  private readonly config: ExporterConfig;
  readonly collectionName = 'settings';
  private genreIdentifierMap: Map<string, string> = new Map(); // id -> identifier

  constructor(config: ExporterConfig) {
    this.config = config;
  }

  async export(): Promise<{ data: SettingPayload[]; result: ExportResult }> {
    log.header(`Exporting ${this.collectionName}`);

    const result: ExportResult = {
      collection: this.collectionName,
      total: 0,
      errors: [],
    };

    try {
      // Load genre id -> identifier map
      await this.loadGenreMap();

      const entities = await this.config.client.request<SettingEntity[]>(
        readItems('settings' as never, {
          limit: -1,
          fields: [
            'identifier',
            'name',
            'translations.languages_code',
            'translations.name',
            'genres.genres_id',
          ] as never,
          sort: ['identifier'] as never,
        })
      );

      const data: SettingPayload[] = entities.map((entity) => ({
        identifier: entity.identifier,
        name: entity.name,
        translations: this.buildTranslations(entity.translations),
        genres: this.resolveGenreIdentifiers(entity.genres),
      }));

      result.total = data.length;
      log.success(`Exported ${data.length} settings`);

      return { data, result };
    } catch (error) {
      const msg = extractErrorMessage(error);
      result.errors.push(msg);
      log.error(`Failed to export settings: ${msg}`);
      return { data: [], result };
    }
  }

  private async loadGenreMap(): Promise<void> {
    const genres = await this.config.client.request<{ id: string; identifier: string }[]>(
      readItems('genres' as never, {
        limit: -1,
        fields: ['id', 'identifier'] as never,
      })
    );

    for (const genre of genres) {
      this.genreIdentifierMap.set(genre.id, genre.identifier);
    }
  }

  private buildTranslations(translations: SettingTranslation[]): Record<LanguageCodes, string> {
    const result = {} as Record<LanguageCodes, string>;

    for (const code of LANGUAGE_CODES) {
      const translation = translations.find((t) => t.languages_code === code);
      result[code] = translation?.name ?? '';
    }

    return result;
  }

  private resolveGenreIdentifiers(genres: GenreRelation[]): string[] {
    return genres
      .map((g) => {
        if (typeof g.genres_id === 'object') {
          return g.genres_id.identifier;
        }
        return this.genreIdentifierMap.get(g.genres_id);
      })
      .filter((id): id is string => id != null);
  }
}
