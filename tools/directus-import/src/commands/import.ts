import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { createItems } from '@directus/sdk';

import { COLLECTION_FILES } from '../services/collections';
import type { DirectusConfig } from '../services/directus';
import { createClient } from '../services/directus';

export interface ImportOptions {
  seedsDir: string;
  collections?: string[];
}

/**
 * Import data from JSON files to Directus
 */
export async function importCommand(config: DirectusConfig, options: ImportOptions) {
  const client = await createClient(config);
  const collections = options.collections ?? Object.keys(COLLECTION_FILES);

  for (const collection of collections) {
    const fileName = COLLECTION_FILES[collection];
    if (!fileName) {
      console.log(`Skipping unknown collection: ${collection}`);
      continue;
    }

    const filePath = join(options.seedsDir, fileName);

    try {
      const content = await readFile(filePath, 'utf-8');
      const data = JSON.parse(content);

      if (!Array.isArray(data) || data.length === 0) {
        console.log(`Skipping ${collection}: no data`);
        continue;
      }

      console.log(`Importing ${collection} (${data.length} items)...`);

      // TODO: Transform payload data to Directus format
      // This will depend on the specific collection structure
      await client.request(createItems(collection, data));

      console.log('  ✓ Imported successfully');
    } catch (error) {
      console.error(`  ✗ Error importing ${collection}:`, error);
    }
  }

  console.log('\nImport completed!');
}
