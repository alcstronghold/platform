import { readFields, updateField } from '@directus/sdk';

import { createClient } from '../services/directus';
import type { DirectusConfig } from '../types';
import { log } from '../utils';

export interface FieldsDisplayOptions {
  dryRun?: boolean;
}

type DirectusClient = Awaited<ReturnType<typeof createClient>>;

interface FieldUpdateConfig {
  collections: string[];
  fieldName: string;
  meta: Record<string, unknown>;
  label: string;
}

/**
 * Update fields across multiple collections with the same meta configuration
 */
async function updateFieldsWithMeta(
  client: DirectusClient,
  fieldMap: Map<string, boolean>,
  config: FieldUpdateConfig,
  dryRun: boolean
): Promise<number> {
  log.info(`Updating ${config.label}...`);
  let count = 0;

  for (const collection of config.collections) {
    const key = `${collection}.${config.fieldName}`;
    if (!fieldMap.has(key)) {
      log.warn(`  Skipping ${key} - field not found`);
      continue;
    }

    if (dryRun) {
      log.item('updated', `Would update ${key}`);
      continue;
    }

    await client.request(
      updateField(collection, config.fieldName, { meta: config.meta })
    );
    log.item('updated', `Updated ${key}`);
    count++;
  }

  return count;
}

/**
 * Collections with identifier fields that need monospace display
 */
const COLLECTIONS_WITH_IDENTIFIER = [
  'age_ranges',
  'session_languages',
  'pronouns',
  'membership_statuses',
  'gender_identities',
  'lgbtiq_options',
  'discovery_sources',
  'knowledge_levels',
  'accessibility_options',
  'content_warnings',
  'safety_measures',
  'rpg_sessions',
  'genres',
  'publishers',
  'settings',
  'rpg_families',
  'rpg_systems',
  'rpg_editions',
];

/**
 * Collections with status fields that need to showAsDot display
 */
const COLLECTIONS_WITH_STATUS = [
  'age_ranges',
  'session_languages',
  'pronouns',
  'membership_statuses',
  'gender_identities',
  'lgbtiq_options',
  'discovery_sources',
  'knowledge_levels',
  'accessibility_options',
  'content_warnings',
  'safety_measures',
  'rpg_sessions',
  'genres',
  'publishers',
  'settings',
  'rpg_families',
  'rpg_systems',
  'rpg_editions',
];

/**
 * Collections with registration status (different colors)
 */
const COLLECTIONS_WITH_REGISTRATION_STATUS = ['rpg_session_players'];

/**
 * Meta configuration for identifier fields (monospace display)
 */
const IDENTIFIER_META = {
  display: 'formatted-value',
  display_options: {
    font: 'monospace',
    bold: true,
  },
  options: {
    slug: true,
    font: 'monospace',
    trim: true,
  },
};

/**
 * Meta configuration for status fields (publish/draft/archived)
 */
const STATUS_META = {
  display: 'labels',
  display_options: {
    showAsDot: true,
    choices: [
      { text: '$t:published', value: 'published', foreground: '#FFFFFF', background: '#2E7D32' },
      { text: '$t:draft', value: 'draft', foreground: '#18222F', background: '#D3DAE4' },
      { text: '$t:archived', value: 'archived', foreground: '#FFFFFF', background: '#F44336' },
    ],
  },
};

/**
 * Meta configuration for registration status fields
 */
const REGISTRATION_STATUS_META = {
  display: 'labels',
  display_options: {
    showAsDot: true,
    choices: [
      { text: 'Registered', value: 'registered', foreground: '#FFFFFF', background: '#2E7D32' },
      { text: 'Waitlist', value: 'waitlist', foreground: '#18222F', background: '#FFC107' },
      { text: 'Cancelled', value: 'cancelled', foreground: '#FFFFFF', background: '#F44336' },
    ],
  },
};

/**
 * Build field map from Directus fields
 */
function buildFieldMap(fields: { collection: string | null; field: string }[]): Map<string, boolean> {
  const map = new Map<string, boolean>();
  for (const field of fields) {
    if (field.collection) {
      map.set(`${field.collection}.${field.field}`, true);
    }
  }
  return map;
}

/**
 * Update field display options
 */
export async function fieldsDisplayCommand(
  config: DirectusConfig,
  options: FieldsDisplayOptions
): Promise<void> {
  const client = await createClient(config);
  const dryRun = options.dryRun ?? false;

  log.header('UPDATE FIELD DISPLAY OPTIONS');
  if (dryRun) {
    log.warn('DRY RUN - No changes will be made');
  }

  try {
    const allFields = await client.request(readFields()) as { collection: string | null; field: string }[];
    const fieldMap = buildFieldMap(allFields);

    const fieldConfigs: FieldUpdateConfig[] = [
      {
        collections: COLLECTIONS_WITH_IDENTIFIER,
        fieldName: 'identifier',
        meta: IDENTIFIER_META,
        label: 'identifier fields',
      },
      {
        collections: COLLECTIONS_WITH_STATUS,
        fieldName: 'status',
        meta: STATUS_META,
        label: 'status fields',
      },
      {
        collections: COLLECTIONS_WITH_REGISTRATION_STATUS,
        fieldName: 'status',
        meta: REGISTRATION_STATUS_META,
        label: 'registration status fields',
      },
    ];

    let updatedCount = 0;
    for (const fieldConfig of fieldConfigs) {
      updatedCount += await updateFieldsWithMeta(client, fieldMap, fieldConfig, dryRun);
    }

    log.success(`Field display options updated! (${updatedCount} fields)`);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log.error(`Failed to update field display options: ${msg}`);
    throw error;
  }
}
