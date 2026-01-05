import type { SimpleEnumPayload } from '@alcstronghold/directus-payload';

import type { ImporterConfig } from '../types';
import { TranslatableImporter } from './base.importer';

/**
 * Entity with simple translations (name only)
 */
interface SimpleEnumEntity {
  id: string;
  identifier: string;
  translations?: Array<{ id: number; languages_code: string }>;
}

/**
 * Configuration for a simple enum importer
 */
export interface SimpleEnumConfig {
  collectionName: string;
}

/**
 * Generic importer for simple enum collections with translations.
 * Works for: age_ranges, session_languages, pronouns, membership_statuses,
 * gender_identities, lgbtiq_options, discovery_sources
 */
export class SimpleEnumImporter extends TranslatableImporter<SimpleEnumPayload, SimpleEnumEntity> {
  readonly collectionName: string;
  readonly identifierField = 'identifier' as const;

  constructor(config: ImporterConfig, enumConfig: SimpleEnumConfig) {
    super(config);
    this.collectionName = enumConfig.collectionName;
  }

  protected toDirectusRequest(
    payload: SimpleEnumPayload,
    existingEntity?: SimpleEnumEntity
  ): Record<string, unknown> {
    const translations = existingEntity
      ? this.updateTranslations(payload.translations, existingEntity.translations)
      : this.createTranslations(payload.translations);

    return {
      identifier: payload.identifier,
      translations,
    };
  }
}

/**
 * Factory function to create a SimpleEnumImporter for a specific collection
 */
export function createSimpleEnumImporter(
  config: ImporterConfig,
  collectionName: string
): SimpleEnumImporter {
  return new SimpleEnumImporter(config, { collectionName });
}
