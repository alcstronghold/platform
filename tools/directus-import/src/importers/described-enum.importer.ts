import type { DescribedEnumPayload } from '@alcstronghold/directus-payload';

import type { ImporterConfig } from '../types';
import { BaseImporter } from './base.importer';

/**
 * Entity with described translations (name and description)
 */
interface DescribedEnumEntity {
  id: string;
  identifier: string;
  translations?: Array<{ id: number; languages_code: string }>;
}

/**
 * Configuration for a described enum importer
 */
export interface DescribedEnumConfig {
  collectionName: string;
}

/**
 * Generic importer for enum collections with name and description translations.
 * Works for: knowledge_levels, accessibility_options, content_warnings, safety_measures
 */
export class DescribedEnumImporter extends BaseImporter<DescribedEnumPayload, DescribedEnumEntity> {
  readonly collectionName: string;
  readonly identifierField = 'identifier' as const;
  protected readonly languageCodes = ['es-ES', 'ca-ES'] as const;

  constructor(config: ImporterConfig, enumConfig: DescribedEnumConfig) {
    super(config);
    this.collectionName = enumConfig.collectionName;
  }

  protected getExistingEntityFields(): string[] {
    return ['id', 'identifier', 'translations.id', 'translations.languages_code'];
  }

  protected toDirectusRequest(
    payload: DescribedEnumPayload,
    existingEntity?: DescribedEnumEntity
  ): Record<string, unknown> {
    const idMap = new Map(
      existingEntity?.translations?.map((t) => [t.languages_code, t.id]) ?? []
    );

    const translations = this.languageCodes.map((code) => {
      const existingId = idMap.get(code);
      const translationData = payload.translations[code] || { name: '', description: null };

      return {
        ...(existingId == null ? {} : { id: existingId }),
        languages_code: code,
        name: translationData.name,
        description: translationData.description,
      };
    });

    return {
      identifier: payload.identifier,
      ...(payload.exclusive_selection !== undefined && { exclusive_selection: payload.exclusive_selection }),
      translations,
    };
  }
}

/**
 * Factory function to create a DescribedEnumImporter for a specific collection
 */
export function createDescribedEnumImporter(
  config: ImporterConfig,
  collectionName: string
): DescribedEnumImporter {
  return new DescribedEnumImporter(config, { collectionName });
}
