import type { RpgFamilyPayload } from '@alcstronghold/directus-payload';
import { readItems } from '@directus/sdk';

import { extractErrorMessage, log } from '../utils';
import type { ExporterConfig, ExportResult, LanguageCodes } from './base.exporter';
import { LANGUAGE_CODES } from './base.exporter';

interface RpgFamilyTranslation {
  languages_code: string;
  name: string;
}

interface SettingRelation {
  settings_id: string | { id: string; identifier: string };
}

interface RpgFamilyEntity {
  identifier: string;
  name: string;
  translations: RpgFamilyTranslation[];
  settings: SettingRelation[];
}

export class RpgFamilyExporter {
  private readonly config: ExporterConfig;
  readonly collectionName = 'rpg_families';
  private settingIdentifierMap: Map<string, string> = new Map(); // id -> identifier

  constructor(config: ExporterConfig) {
    this.config = config;
  }

  async export(): Promise<{ data: RpgFamilyPayload[]; result: ExportResult }> {
    log.header(`Exporting ${this.collectionName}`);

    const result: ExportResult = {
      collection: this.collectionName,
      total: 0,
      errors: [],
    };

    try {
      // Load setting id -> identifier map
      await this.loadSettingMap();

      const entities = await this.config.client.request<RpgFamilyEntity[]>(
        readItems('rpg_families' as never, {
          limit: -1,
          fields: [
            'identifier',
            'name',
            'translations.languages_code',
            'translations.name',
            'settings.settings_id',
          ] as never,
          sort: ['identifier'] as never,
        })
      );

      const data: RpgFamilyPayload[] = entities.map((entity) => ({
        identifier: entity.identifier,
        name: entity.name,
        translations: this.buildTranslations(entity.translations),
        settings: this.resolveSettingIdentifiers(entity.settings),
      }));

      result.total = data.length;
      log.success(`Exported ${data.length} rpg_families`);

      return { data, result };
    } catch (error) {
      const msg = extractErrorMessage(error);
      result.errors.push(msg);
      log.error(`Failed to export rpg_families: ${msg}`);
      return { data: [], result };
    }
  }

  private async loadSettingMap(): Promise<void> {
    const settings = await this.config.client.request<{ id: string; identifier: string }[]>(
      readItems('settings' as never, {
        limit: -1,
        fields: ['id', 'identifier'] as never,
      })
    );

    for (const setting of settings) {
      this.settingIdentifierMap.set(setting.id, setting.identifier);
    }
  }

  private buildTranslations(translations: RpgFamilyTranslation[]): Record<LanguageCodes, string> {
    const result = {} as Record<LanguageCodes, string>;

    for (const code of LANGUAGE_CODES) {
      const translation = translations.find((t) => t.languages_code === code);
      result[code] = translation?.name ?? '';
    }

    return result;
  }

  private resolveSettingIdentifiers(settings: SettingRelation[]): string[] {
    return settings
      .map((s) => {
        if (typeof s.settings_id === 'object') {
          return s.settings_id.identifier;
        }
        return this.settingIdentifierMap.get(s.settings_id);
      })
      .filter((id): id is string => id != null);
  }
}
