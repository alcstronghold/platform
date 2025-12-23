import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { readItems } from '@directus/sdk';
import type { DirectusConfig } from '../services/directus';
import { createClient } from '../services/directus';
import { COLLECTION_FILES } from '../services/collections';

export interface ExportOptions {
  seedsDir: string;
  collections?: string[];
}

/**
 * Export data from Directus to JSON files (in Payload format)
 */
export async function exportCommand(config: DirectusConfig, options: ExportOptions) {
  const client = await createClient(config);
  const collections = options.collections ?? Object.keys(COLLECTION_FILES);

  // Ensure output directory exists
  await mkdir(options.seedsDir, { recursive: true });

  for (const collection of collections) {
    const fileName = COLLECTION_FILES[collection];
    if (!fileName) {
      console.log(`Skipping unknown collection: ${collection}`);
      continue;
    }

    try {
      console.log(`Exporting ${collection}...`);

      const data = await client.request(readItems(collection, { limit: -1 }));

      if (!Array.isArray(data) || data.length === 0) {
        console.log(`  - No data found`);
        continue;
      }

      // TODO: Transform Directus data to Payload format
      // This will depend on the specific collection structure

      const filePath = join(options.seedsDir, fileName);
      await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');

      console.log(`  ✓ Exported ${data.length} items`);
    } catch (error) {
      console.error(`  ✗ Error exporting ${collection}:`, error);
    }
  }

  console.log('\nExport completed!');
}
