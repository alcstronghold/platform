import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import type {
  GenrePayload,
  LanguagePayload,
  PublisherPayload,
  RpgEditionPayload,
  RpgFamilyPayload,
  RpgSystemPayload,
  SettingPayload,
} from '@alcstronghold/directus-payload';

import {
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

export type { ImportOptions };

/**
 * Collection configuration for imports
 */
interface CollectionConfig {
  fileName: string;
  order: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  importer: new (config: ImporterConfig) => { import: (items: any[]) => Promise<ImportResult> };
}

/**
 * Registry of supported collections and their importers
 */
const COLLECTIONS: Record<string, CollectionConfig> = {
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
    throw new Error('JSON file must contain an array');
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

      // Create importer instance
      const importerConfig: ImporterConfig = {
        client,
        url: config.url,
        token: config.token || '',
        verbose: options.verbose,
      };

      const Importer = collectionConfig.importer;
      const importer = new Importer(importerConfig);

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
