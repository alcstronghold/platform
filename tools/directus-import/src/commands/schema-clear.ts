import { deleteCollection, deleteItems, readCollections, readItems } from '@directus/sdk';

import type { DirectusConfig } from '../services/directus';
import { createClient } from '../services/directus';
import { extractErrorMessage, log } from '../utils';

export interface SchemaClearOptions {
  dryRun?: boolean;
  force?: boolean;
}

interface CollectionInfo {
  collection: string;
  meta?: {
    system?: boolean;
  };
}

// System collections that should never be deleted
const SYSTEM_PREFIXES = ['directus_'];

/**
 * Clear all custom collections from Directus.
 * This removes all non-system collections (structure only, data is also lost).
 */
export async function schemaClearCommand(
  config: DirectusConfig,
  options: SchemaClearOptions
): Promise<void> {
  const client = await createClient(config);

  log.header('SCHEMA CLEAR');
  if (options.dryRun) {
    log.warn('DRY RUN - No changes will be applied');
  }

  try {
    // Get all collections
    log.info('Fetching collections...');
    const collections = await client.request(readCollections()) as CollectionInfo[];

    // Filter out system collections
    const customCollections = collections.filter((col) => {
      // Skip if no collection name
      if (!col.collection) return false;

      // Skip system collections (directus_*)
      if (SYSTEM_PREFIXES.some((prefix) => col.collection.startsWith(prefix))) {
        return false;
      }

      // Skip if marked as system
      if (col.meta?.system) return false;

      return true;
    });

    if (customCollections.length === 0) {
      log.success('No custom collections found. Schema is already clean.');
      return;
    }

    log.warn(`Found ${customCollections.length} custom collections to delete:`);
    for (const col of customCollections) {
      console.log(`  - ${col.collection}`);
    }

    // Confirm if not forced
    if (!options.force && !options.dryRun) {
      log.error('This will DELETE all custom collections and their DATA!');
      log.error('Use --force to confirm, or --dry-run to preview.');
      return;
    }

    if (options.dryRun) {
      log.warn('DRY RUN complete. Use --force to actually delete collections.');
      return;
    }

    // Sort collections: translations first, then junction tables, then others
    const sortedCollections = [...customCollections].sort((a, b) => {
      const aName = a.collection;
      const bName = b.collection;

      // Translation tables first (they have FK to parent)
      const aIsTranslation = aName.endsWith('_translations');
      const bIsTranslation = bName.endsWith('_translations');
      if (aIsTranslation && !bIsTranslation) return -1;
      if (!aIsTranslation && bIsTranslation) return 1;

      // Junction tables second (M2M tables have FK to both sides)
      const aIsJunction = aName.includes('_') && !aIsTranslation;
      const bIsJunction = bName.includes('_') && !bIsTranslation;
      if (aIsJunction && !bIsJunction) return -1;
      if (!aIsJunction && bIsJunction) return 1;

      return 0;
    });

    log.info('Deleting collections (with retry for dependencies)...');

    let deleted = 0;
    let pending = sortedCollections.map((c) => c.collection);
    const maxPasses = 5;

    for (let pass = 1; pass <= maxPasses && pending.length > 0; pass++) {
      const failed: string[] = [];

      if (pass > 1) {
        log.info(`Pass ${pass}: retrying ${pending.length} collections...`);
      }

      for (const collection of pending) {
        try {
          await client.request(deleteCollection(collection));
          log.item('created', collection); // Using 'created' for green checkmark
          deleted++;
        } catch (error) {
          // On failure, try to clear all data first (helps with self-referential FKs)
          try {
            // Get all item IDs in the collection
            const items = await client.request(
              readItems(collection as never, {
                limit: -1,
                fields: ['id'] as never,
              })
            ) as { id: string | number }[];

            if (items.length > 0) {
              const ids = items.map((i) => i.id);
              await client.request(deleteItems(collection as never, ids as never));
              log.info(`  Cleared ${items.length} items from ${collection}`);
            }
          } catch {
            // Ignore errors clearing data
          }

          // Silently collect failures for retry
          failed.push(collection);
        }
      }

      pending = failed;

      // If no progress was made this pass, break
      if (failed.length === pending.length && pass > 1) {
        break;
      }
    }

    // Log any remaining failures
    if (pending.length > 0) {
      log.warn(`Could not delete ${pending.length} collections (may have external dependencies):`);
      for (const col of pending) {
        log.item('failed', col);
      }
    }

    console.log('');
    if (pending.length === 0) {
      log.success(`Schema cleared successfully (${deleted} collections deleted)`);
    } else {
      log.warn(`Schema partially cleared (${deleted} deleted, ${pending.length} could not be deleted)`);
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log.error(`Failed to clear schema: ${msg}`);
    throw error;
  }
}
