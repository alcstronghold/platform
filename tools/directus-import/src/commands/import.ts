import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import type {
  DescribedEnumPayload,
  GenrePayload,
  LanguagePayload,
  PublisherPayload,
  RpgEditionPayload,
  RpgFamilyPayload,
  RpgSystemPayload,
  SettingPayload,
  SimpleEnumPayload,
} from '@alcstronghold/directus-payload';

import {
  createDescribedEnumImporter,
  createSimpleEnumImporter,
  GenreImporter,
  LanguageImporter,
  PublisherImporter,
  RpgEditionImporter,
  RpgFamilyImporter,
  RpgSystemImporter,
  SettingImporter,
} from '../importers';
import { createClient } from '../services/directus';
import type { DirectusConfig, ImporterConfig, ImportOptions, ImportResult } from '../types';
import { log } from '../utils';

export type { ImportOptions } from '../types';

/**
 * Importer interface for polymorphic handling
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface Importer { import: (items: any[]) => Promise<ImportResult> }

/**
 * Collection configuration for imports
 */
interface CollectionConfig {
  fileName: string;
  order: number;
  /** Class constructor for the importer */
  importer?: new (config: ImporterConfig) => Importer;
  /** Factory function for the importer (for enum collections) */
  factory?: (config: ImporterConfig) => Importer;
}

/**
 * Registry of supported collections and their importers
 */
const COLLECTIONS: Record<string, CollectionConfig> = {
  // Base collections
  languages: {
    fileName: 'languages.json',
    order: 1,
    importer: LanguageImporter,
  },
  genres: {
    fileName: 'genres.json',
    order: 2,
    importer: GenreImporter,
  },
  publishers: {
    fileName: 'publishers.json',
    order: 3,
    importer: PublisherImporter,
  },
  settings: {
    fileName: 'settings.json',
    order: 4,
    importer: SettingImporter,
  },
  rpg_families: {
    fileName: 'rpg-families.json',
    order: 5,
    importer: RpgFamilyImporter,
  },
  rpg_systems: {
    fileName: 'rpg-systems.json',
    order: 6,
    importer: RpgSystemImporter,
  },
  rpg_editions: {
    fileName: 'rpg-editions.json',
    order: 7,
    importer: RpgEditionImporter,
  },

  // Auxiliary collections - Simple enums (name only translations)
  age_ranges: {
    fileName: 'age-ranges.json',
    order: 10,
    factory: (config) => createSimpleEnumImporter(config, 'age_ranges'),
  },
  session_languages: {
    fileName: 'session-languages.json',
    order: 11,
    factory: (config) => createSimpleEnumImporter(config, 'session_languages'),
  },
  pronouns: {
    fileName: 'pronouns.json',
    order: 12,
    factory: (config) => createSimpleEnumImporter(config, 'pronouns'),
  },
  membership_statuses: {
    fileName: 'membership-statuses.json',
    order: 13,
    factory: (config) => createSimpleEnumImporter(config, 'membership_statuses'),
  },
  gender_identities: {
    fileName: 'gender-identities.json',
    order: 14,
    factory: (config) => createSimpleEnumImporter(config, 'gender_identities'),
  },
  lgbtiq_options: {
    fileName: 'lgbtiq-options.json',
    order: 15,
    factory: (config) => createSimpleEnumImporter(config, 'lgbtiq_options'),
  },
  discovery_sources: {
    fileName: 'discovery-sources.json',
    order: 16,
    factory: (config) => createSimpleEnumImporter(config, 'discovery_sources'),
  },

  // Auxiliary collections - Described enums (name and description translations)
  knowledge_levels: {
    fileName: 'knowledge-levels.json',
    order: 20,
    factory: (config) => createDescribedEnumImporter(config, 'knowledge_levels'),
  },
  accessibility_options: {
    fileName: 'accessibility-options.json',
    order: 21,
    factory: (config) => createDescribedEnumImporter(config, 'accessibility_options'),
  },
  content_warnings: {
    fileName: 'content-warnings.json',
    order: 22,
    factory: (config) => createDescribedEnumImporter(config, 'content_warnings'),
  },
  safety_measures: {
    fileName: 'safety-measures.json',
    order: 23,
    factory: (config) => createDescribedEnumImporter(config, 'safety_measures'),
  },
};

/**
 * Load JSON data from a file, handling BOM and validation
 */
async function loadJsonFile<T>(filePath: string): Promise<T[]> {
  let content = await readFile(filePath, 'utf-8');

  // Remove BOM if present
  if (content.codePointAt(0) === 0xfeff) {
    content = content.slice(1);
  }

  const data = JSON.parse(content) as T[];

  if (!Array.isArray(data)) {
    throw new TypeError('JSON file must contain an array');
  }

  return data;
}

/**
 * Import data from JSON files to Directus
 */
export async function importCommand(config: DirectusConfig, options: ImportOptions): Promise<void> {
  const client = await createClient(config);

  // Determine which collections to import
  const requestedCollections = options.collections ?? Object.keys(COLLECTIONS);

  // Sort by order
  const collectionsToImport = requestedCollections
    .filter((name) => COLLECTIONS[name])
    .sort((a, b) => COLLECTIONS[a].order - COLLECTIONS[b].order);

  const unknownCollections = requestedCollections.filter((name) => !COLLECTIONS[name]);
  if (unknownCollections.length > 0) {
    log.warn(`Unknown collections will be skipped: ${unknownCollections.join(', ')}`);
  }

  log.header('DIRECTUS IMPORT');
  log.summary(`Collections: ${collectionsToImport.join(', ')}`);
  log.summary(`Seeds directory: ${options.seedsDir}`);

  const results: ImportResult[] = [];

  for (const collectionName of collectionsToImport) {
    const collectionConfig = COLLECTIONS[collectionName];
    const filePath = join(options.seedsDir, collectionConfig.fileName);

    try {
      // Load data from JSON file
      const data = await loadJsonFile(filePath);

      if (data.length === 0) {
        log.warn(`Skipping ${collectionName}: no data in file`);
        continue;
      }

      // Create the importer instance
      const importerConfig: ImporterConfig = {
        client,
        url: config.url,
        token: config.token || '',
        verbose: options.verbose,
      };

      // Create an importer using either factory or constructor
      let importer: Importer;
      if (collectionConfig.factory) {
        importer = collectionConfig.factory(importerConfig);
      } else if (collectionConfig.importer) {
        importer = new collectionConfig.importer(importerConfig);
      } else {
        log.error(`No importer configured for ${collectionName}`);
        results.push({
          collection: collectionName,
          total: 0,
          created: 0,
          updated: 0,
          failed: 1,
          errors: [{ identifier: 'config', error: 'No importer configured' }],
        });
        continue;
      }

      // Run import
      const result = await importer.import(
        data as
          | LanguagePayload[]
          | GenrePayload[]
          | PublisherPayload[]
          | SettingPayload[]
          | RpgFamilyPayload[]
          | RpgSystemPayload[]
          | RpgEditionPayload[]
          | SimpleEnumPayload[]
          | DescribedEnumPayload[]
      );
      results.push(result);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      log.error(`Failed to import ${collectionName}: ${errorMsg}`);
      results.push({
        collection: collectionName,
        total: 0,
        created: 0,
        updated: 0,
        failed: 1,
        errors: [{ identifier: 'file', error: errorMsg }],
      });
    }
  }

  // Print final summary
  printFinalSummary(results);
}

/**
 * Print overall summary of all imports
 */
function printFinalSummary(results: ImportResult[]): void {
  log.header('IMPORT SUMMARY');

  const totals = results.reduce(
    (acc, r) => ({
      total: acc.total + r.total,
      created: acc.created + r.created,
      updated: acc.updated + r.updated,
      failed: acc.failed + r.failed,
    }),
    { total: 0, created: 0, updated: 0, failed: 0 }
  );

  const status = totals.failed === 0 ? '✓' : '⚠';

  console.log('');
  for (const result of results) {
    const rStatus = result.failed === 0 ? '✓' : '✗';
    const success = result.created + result.updated;
    console.log(
      `  ${rStatus} ${result.collection}: ${success}/${result.total} (${result.created} new, ${result.updated} updated)`
    );
  }

  console.log('');
  log.summary(
    `${status} Total: ${totals.created + totals.updated}/${totals.total} items imported (${totals.created} created, ${totals.updated} updated, ${totals.failed} failed)`
  );
}
