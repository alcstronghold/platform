import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import type { ExporterConfig } from '../exporters';
import {
  GenreExporter,
  LanguageExporter,
  PublisherExporter,
  RpgEditionExporter,
  RpgFamilyExporter,
  RpgSystemExporter,
  SettingExporter,
} from '../exporters';
import { COLLECTION_FILES } from '../services/collections';
import type { DirectusConfig } from '../services/directus';
import { createClient } from '../services/directus';
import { log } from '../utils';

export interface ExportOptions {
  seedsDir: string;
  collections?: string[];
}

type ExporterClass = new (config: ExporterConfig) => {
  collectionName: string;
  export(): Promise<{ data: unknown[]; result: { total: number; errors: string[] } }>;
};

const EXPORTERS: Record<string, ExporterClass> = {
  languages: LanguageExporter,
  genres: GenreExporter,
  publishers: PublisherExporter,
  settings: SettingExporter,
  rpg_families: RpgFamilyExporter,
  rpg_systems: RpgSystemExporter,
  rpg_editions: RpgEditionExporter,
};

// Export order (dependencies first)
const EXPORT_ORDER = [
  'languages',
  'genres',
  'publishers',
  'settings',
  'rpg_families',
  'rpg_systems',
  'rpg_editions',
];

/**
 * Export data from Directus to JSON files (in Payload format)
 */
export async function exportCommand(config: DirectusConfig, options: ExportOptions): Promise<void> {
  const client = await createClient(config);
  const exporterConfig: ExporterConfig = { client };

  // Determine which collections to export
  const requestedCollections = options.collections ?? EXPORT_ORDER;
  const collections = EXPORT_ORDER.filter((c) => requestedCollections.includes(c));

  log.header('DATA EXPORT');
  log.summary(`Output: ${options.seedsDir}`);
  log.summary(`Collections: ${collections.join(', ')}`);

  // Ensure output directory exists
  await mkdir(options.seedsDir, { recursive: true });

  let totalExported = 0;
  let totalErrors = 0;

  for (const collection of collections) {
    const ExporterClass = EXPORTERS[collection];
    const fileName = COLLECTION_FILES[collection];

    if (!ExporterClass || !fileName) {
      log.warn(`Skipping unknown collection: ${collection}`);
      continue;
    }

    const exporter = new ExporterClass(exporterConfig);
    const { data, result } = await exporter.export();

    if (data.length > 0) {
      const filePath = join(options.seedsDir, fileName);
      await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    }

    totalExported += result.total;
    totalErrors += result.errors.length;
  }

  console.log('');
  if (totalErrors === 0) {
    log.success(`Export completed: ${totalExported} items exported`);
  } else {
    log.warn(`Export completed with errors: ${totalExported} items exported, ${totalErrors} errors`);
  }
}
