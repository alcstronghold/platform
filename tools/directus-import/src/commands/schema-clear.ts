import {
  deleteCollection,
  deleteItems,
  readCollections,
  readItems,
  readRelations,
  updateItems,
} from '@directus/sdk';

import { createClient } from '../services/directus';
import type { CollectionInfo, DeleteResult, DirectusConfig, RelationInfo, SchemaClearOptions } from '../types';
import { DeletionPriority } from '../types';
import { extractErrorMessage, log } from '../utils';

export type { SchemaClearOptions } from '../types';

type DirectusClient = Awaited<ReturnType<typeof createClient>>;

// ─────────────────────────────────────────────────────────────────────────────
// Predicates
// ─────────────────────────────────────────────────────────────────────────────

const isSystemCollection = (col: CollectionInfo): boolean =>
  !col.collection || col.collection.startsWith('directus_') || col.meta?.system === true;

const isFolderCollection = (col: CollectionInfo): boolean =>
  col.schema === null;

const isTranslationTable = (name: string): boolean =>
  name.endsWith('_translations');

const isJunctionTable = (name: string): boolean =>
  name.includes('_') && !isTranslationTable(name);

const isTableMissing = (error: string): boolean =>
  error.includes('does not exist') || error.includes('INVALID_COLLECTION');

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function findSelfReferencingFields(collection: string, relations: RelationInfo[]): string[] {
  return relations
    .filter((r) => r.collection === collection && r.related_collection === collection)
    .map((r) => r.field);
}

function getDeletionPriority(col: CollectionInfo): DeletionPriority {
  if (isTranslationTable(col.collection)) return DeletionPriority.Translation;
  if (isJunctionTable(col.collection)) return DeletionPriority.Junction;
  if (!isFolderCollection(col)) return DeletionPriority.Table;
  return DeletionPriority.Folder;
}

function sortForDeletion(collections: CollectionInfo[]): CollectionInfo[] {
  return [...collections].sort((a, b) => getDeletionPriority(a) - getDeletionPriority(b));
}

// ─────────────────────────────────────────────────────────────────────────────
// Data Operations
// ─────────────────────────────────────────────────────────────────────────────

async function nullifySelfReferences(
  client: DirectusClient,
  collection: string,
  fields: string[]
): Promise<number> {
  if (fields.length === 0) return 0;

  try {
    const items = (await client.request(
      readItems(collection as never, { limit: -1, fields: ['id', ...fields] as never })
    )) as { id: string }[];

    if (items.length === 0) return 0;

    const nullPayload = Object.fromEntries(fields.map((f) => [f, null]));
    await client.request(
      updateItems(collection as never, items.map((i) => i.id) as never, nullPayload as never)
    );
    return items.length;
  } catch (error) {
    if (isTableMissing(extractErrorMessage(error))) return -1;
    throw error;
  }
}

async function deleteAllItems(client: DirectusClient, collection: string): Promise<number> {
  try {
    const items = (await client.request(
      readItems(collection as never, { limit: -1, fields: ['id'] as never })
    )) as { id: string }[];

    if (items.length === 0) return 0;

    await client.request(deleteItems(collection as never, items.map((i) => i.id) as never));
    return items.length;
  } catch (error) {
    if (isTableMissing(extractErrorMessage(error))) return -1;
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Collection Deletion
// ─────────────────────────────────────────────────────────────────────────────

async function tryDeleteCollection(
  client: DirectusClient,
  col: CollectionInfo,
  relations: RelationInfo[]
): Promise<DeleteResult> {
  try {
    if (!isFolderCollection(col)) {
      const selfRefFields = findSelfReferencingFields(col.collection, relations);
      const nullified = await nullifySelfReferences(client, col.collection, selfRefFields);
      if (nullified > 0) log.info(`  Nullified ${selfRefFields.join(', ')} in ${nullified} items`);

      const deleted = await deleteAllItems(client, col.collection);
      if (deleted > 0) log.info(`  Deleted ${deleted} items from ${col.collection}`);
    }

    await client.request(deleteCollection(col.collection));
    return { success: true };
  } catch (error) {
    return { success: false, error: extractErrorMessage(error) };
  }
}

async function deleteCollectionsWithRetry(
  client: DirectusClient,
  collections: CollectionInfo[],
  relations: RelationInfo[],
  maxPasses: number
): Promise<{ deleted: number; failed: CollectionInfo[] }> {
  let deleted = 0;
  let pending = [...collections];

  for (let pass = 1; pass <= maxPasses && pending.length > 0; pass++) {
    if (pass > 1) log.info(`Pass ${pass}: retrying ${pending.length} remaining collections...`);

    const stillPending: CollectionInfo[] = [];

    for (const col of pending) {
      const result = await tryDeleteCollection(client, col, relations);
      if (result.success) {
        log.item('created', col.collection);
        deleted++;
      } else {
        stillPending.push(col);
      }
    }

    pending = stillPending;
  }

  return { deleted, failed: pending };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Command
// ─────────────────────────────────────────────────────────────────────────────

export async function schemaClearCommand(
  config: DirectusConfig,
  options: SchemaClearOptions
): Promise<void> {
  const client = await createClient(config);

  log.header('SCHEMA CLEAR');
  if (options.dryRun) log.warn('DRY RUN - No changes will be applied');

  log.info('Fetching collections and relations...');
  const [allCollections, allRelations] = await Promise.all([
    client.request(readCollections()) as Promise<CollectionInfo[]>,
    client.request(readRelations()) as Promise<RelationInfo[]>,
  ]);

  const customCollections = allCollections.filter((col) => !isSystemCollection(col));

  if (customCollections.length === 0) {
    log.success('No custom collections found. Schema is already clean.');
    return;
  }

  log.warn(`Found ${customCollections.length} custom collections to delete:`);
  customCollections.forEach((col) => {
    console.log(`  - ${col.collection}${isFolderCollection(col) ? ' (folder)' : ''}`);
  });

  if (!options.force && !options.dryRun) {
    log.error('This will DELETE all custom collections and their DATA!');
    log.error('Use --force to confirm, or --dry-run to preview.');
    return;
  }

  if (options.dryRun) {
    log.warn('DRY RUN complete. Use --force to actually delete collections.');
    return;
  }

  log.info('Deleting collections...');
  const sorted = sortForDeletion(customCollections);
  const { deleted, failed } = await deleteCollectionsWithRetry(client, sorted, allRelations, 5);

  console.log('');
  if (failed.length === 0) {
    log.success(`Schema cleared successfully (${deleted} collections deleted)`);
  } else {
    log.warn(`Schema partially cleared (${deleted} deleted, ${failed.length} failed)`);
    failed.forEach((col) => log.item('failed', col.collection));
  }
}
