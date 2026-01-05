import { readFile } from 'node:fs/promises';

import { schemaApply, schemaDiff } from '@directus/sdk';

import { createClient } from '../services/directus';
import type { DirectusConfig, SchemaDiffResult, SchemaImportOptions } from '../types';
import { log } from '../utils';

export type { SchemaImportOptions } from '../types';

/**
 * Import Directus schema from a JSON file.
 * Uses diff and apply to only make necessary changes.
 */
export async function schemaImportCommand(
  config: DirectusConfig,
  options: SchemaImportOptions
): Promise<void> {
  const client = await createClient(config);

  log.header('SCHEMA IMPORT');
  log.summary(`Input: ${options.inputPath}`);
  if (options.dryRun) {
    log.warn('DRY RUN - No changes will be applied');
  }

  try {
    // Read the snapshot from the file
    log.info('Reading schema snapshot...');
    const content = await readFile(options.inputPath, 'utf-8');
    const snapshot = JSON.parse(content);

    // Generate diff between snapshot and current schema
    log.info('Generating schema diff...');
    const diffResult = await client.request(
      schemaDiff(snapshot, options.force)
    ) as SchemaDiffResult;

    // Count changes in the diff object
    const { diff } = diffResult;
    const collectionsCount = diff.collections?.length ?? 0;
    const fieldsCount = diff.fields?.length ?? 0;
    const relationsCount = diff.relations?.length ?? 0;
    const totalChanges = collectionsCount + fieldsCount + relationsCount;

    // Check if there are changes
    if (totalChanges === 0) {
      log.success('Schema is already up to date. No changes needed.');
      return;
    }

    // Log the changes
    log.info(`Found ${totalChanges} changes:`);
    log.summary(`  Collections: ${collectionsCount}, Fields: ${fieldsCount}, Relations: ${relationsCount}`);

    if (diff.collections) {
      for (const change of diff.collections.slice(0, 5)) {
        log.item('updated', `collection: ${change.collection}`);
      }
      if (collectionsCount > 5) {
        log.info(`  ... and ${collectionsCount - 5} more collection changes`);
      }
    }

    // Apply changes (unless dry run)
    if (options.dryRun) {
      log.warn('DRY RUN complete. Use without --dry-run to apply changes.');
      return;
    }

    log.info('Applying schema changes...');
    await client.request(schemaApply(diffResult));

    log.success(`Schema imported successfully (${totalChanges} changes applied)`);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log.error(`Failed to import schema: ${msg}`);
    throw error;
  }
}
