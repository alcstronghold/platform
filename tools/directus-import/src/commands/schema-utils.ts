import { schemaApply, schemaDiff } from '@directus/sdk';

import { createClient } from '../services/directus';
import type { DirectusConfig, SchemaDiffResult } from '../types';
import { log } from '../utils';

/**
 * Field definition helper
 */
export interface FieldDef {
  collection: string;
  field: string;
  type: string;
  meta?: Record<string, unknown>;
  schema?: Record<string, unknown> | null;
}

/**
 * Relation definition helper
 */
export interface RelationDef {
  collection: string;
  field: string;
  related_collection: string | null;
  meta?: Record<string, unknown>;
  schema?: Record<string, unknown> | null;
}

/**
 * Apply schema changes to Directus
 */
export async function applySchemaChanges(
  config: DirectusConfig,
  schema: Record<string, unknown>,
  force?: boolean
): Promise<{ applied: boolean; totalChanges: number }> {
  const client = await createClient(config);

  log.info('Applying schema changes to Directus...');
  const diffResult = await client.request(
    schemaDiff(schema as Parameters<typeof schemaDiff>[0], force)
  ) as SchemaDiffResult;

  const { diff } = diffResult;
  const totalChanges =
    (diff.collections?.length ?? 0) +
    (diff.fields?.length ?? 0) +
    (diff.relations?.length ?? 0);

  if (totalChanges === 0) {
    log.success('Schema is already up to date. No changes needed.');
    return { applied: false, totalChanges: 0 };
  }

  log.info(`Applying ${totalChanges} changes...`);
  await client.request(schemaApply(diffResult));

  return { applied: true, totalChanges };
}