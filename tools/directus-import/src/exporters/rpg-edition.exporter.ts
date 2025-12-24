import type { RpgEditionPayload } from '@alcstronghold/directus-payload';
import type { LanguageCodes } from '@alcstronghold/directus-schema';
import { readItems } from '@directus/sdk';

import type {
  ExporterConfig,
  ExportResult,
  RpgEditionEntity,
  RpgEditionTranslation,
} from '../types';
import { extractErrorMessage, log } from '../utils';
import { LANGUAGE_CODES } from './base.exporter';

export class RpgEditionExporter {
  private readonly config: ExporterConfig;
  readonly collectionName = 'rpg_editions';
  private familyIdentifierMap: Map<string, string> = new Map();
  private systemIdentifierMap: Map<string, string> = new Map();

  constructor(config: ExporterConfig) {
    this.config = config;
  }

  async export(): Promise<{ data: RpgEditionPayload[]; result: ExportResult }> {
    log.header(`Exporting ${this.collectionName}`);

    const result: ExportResult = {
      collection: this.collectionName,
      total: 0,
      errors: [],
    };

    try {
      // Load lookup maps
      await this.loadMaps();

      const entities = await this.config.client.request<RpgEditionEntity[]>(
        readItems('rpg_editions' as never, {
          limit: -1,
          fields: [
            'identifier',
            'name',
            'bgg_id',
            'rpg_system_id',
            'rpg_family_id',
            'translations.languages_code',
            'translations.name',
          ] as never,
          sort: ['identifier'] as never,
        })
      );

      const data: RpgEditionPayload[] = entities.map((entity) => ({
        identifier: entity.identifier,
        name: entity.name,
        rpg_system_id: this.resolveIdentifier(entity.rpg_system_id, this.systemIdentifierMap),
        rpg_family_id: this.resolveIdentifier(entity.rpg_family_id, this.familyIdentifierMap) ?? '',
        translations: this.buildTranslations(entity.translations),
        bgg_id: entity.bgg_id,
      }));

      result.total = data.length;
      log.success(`Exported ${data.length} rpg_editions`);

      return { data, result };
    } catch (error) {
      const msg = extractErrorMessage(error);
      result.errors.push(msg);
      log.error(`Failed to export rpg_editions: ${msg}`);
      return { data: [], result };
    }
  }

  private async loadMaps(): Promise<void> {
    const [families, systems] = await Promise.all([
      this.config.client.request<{ id: string; identifier: string }[]>(
        readItems('rpg_families' as never, {
          limit: -1,
          fields: ['id', 'identifier'] as never,
        })
      ),
      this.config.client.request<{ id: string; identifier: string }[]>(
        readItems('rpg_systems' as never, {
          limit: -1,
          fields: ['id', 'identifier'] as never,
        })
      ),
    ]);

    for (const family of families) {
      this.familyIdentifierMap.set(family.id, family.identifier);
    }

    for (const system of systems) {
      this.systemIdentifierMap.set(system.id, system.identifier);
    }
  }

  private buildTranslations(translations: RpgEditionTranslation[]): Record<LanguageCodes, string> {
    const result = {} as Record<LanguageCodes, string>;

    for (const code of LANGUAGE_CODES) {
      const translation = translations.find((t) => t.languages_code === code);
      result[code] = translation?.name ?? '';
    }

    return result;
  }

  private resolveIdentifier(
    value: string | null | { id: string; identifier: string },
    map: Map<string, string>
  ): string | null {
    if (!value) return null;

    if (typeof value === 'object') {
      return value.identifier;
    }

    return map.get(value) ?? null;
  }
}
