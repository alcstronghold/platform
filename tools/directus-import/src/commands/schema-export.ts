import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

import { schemaSnapshot } from '@directus/sdk';

import type { DirectusConfig } from '../services/directus';
import { createClient } from '../services/directus';
import { log } from '../utils';

export interface SchemaExportOptions {
  outputPath: string;
}

/**
 * Export Directus schema (collections, fields, relations) to a JSON file.
 * This exports only the structure, not the data.
 */
export async function schemaExportCommand(
  config: DirectusConfig,
  options: SchemaExportOptions
): Promise<void> {
  const client = await createClient(config);

  log.header('SCHEMA EXPORT');
  log.summary(`Output: ${options.outputPath}`);

  try {
    // Get schema snapshot from Directus
    log.info('Fetching schema snapshot...');
    const snapshot = await client.request(schemaSnapshot());

    // Ensure output directory exists
    await mkdir(dirname(options.outputPath), { recursive: true });

    // Write snapshot to file
    await writeFile(options.outputPath, JSON.stringify(snapshot, null, 2), 'utf-8');

    // Count elements
    const data = snapshot as {
      collections?: unknown[];
      fields?: unknown[];
      relations?: unknown[];
    };
    const collections = data.collections?.length ?? 0;
    const fields = data.fields?.length ?? 0;
    const relations = data.relations?.length ?? 0;

    log.success('Schema exported successfully');
    log.summary(`Collections: ${collections}, Fields: ${fields}, Relations: ${relations}`);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log.error(`Failed to export schema: ${msg}`);
    throw error;
  }
}
