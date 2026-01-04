import { readFields, updateField } from '@directus/sdk';

import { createClient } from '../services/directus';
import type { DirectusConfig } from '../types';
import { log } from '../utils';

export interface FieldsDisplayOptions {
  dryRun?: boolean;
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
 * Update field display options
 */
export async function fieldsDisplayCommand(
  config: DirectusConfig,
  options: FieldsDisplayOptions
): Promise<void> {
  const client = await createClient(config);

  log.header('UPDATE FIELD DISPLAY OPTIONS');
  if (options.dryRun) {
    log.warn('DRY RUN - No changes will be made');
  }

  try {
    // Get all fields to verify they exist
    const allFields = await client.request(readFields());
    const fieldMap = new Map<string, boolean>();
    for (const field of allFields) {
      fieldMap.set(`${field.collection}.${field.field}`, true);
    }

    let updatedCount = 0;

    // Update identifier fields
    log.info('Updating identifier fields...');
    for (const collection of COLLECTIONS_WITH_IDENTIFIER) {
      const key = `${collection}.identifier`;
      if (!fieldMap.has(key)) {
        log.warn(`  Skipping ${collection}.identifier - field not found`);
        continue;
      }

      if (options.dryRun) {
        log.item('~', `Would update ${collection}.identifier`);
      } else {
        await client.request(
          updateField(collection, 'identifier', {
            meta: {
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
            },
          })
        );
        log.item('✓', `Updated ${collection}.identifier`);
        updatedCount++;
      }
    }

    // Update status fields with publish/draft/archived
    log.info('Updating status fields...');
    for (const collection of COLLECTIONS_WITH_STATUS) {
      const key = `${collection}.status`;
      if (!fieldMap.has(key)) {
        log.warn(`  Skipping ${collection}.status - field not found`);
        continue;
      }

      if (options.dryRun) {
        log.item('~', `Would update ${collection}.status`);
      } else {
        await client.request(
          updateField(collection, 'status', {
            meta: {
              display: 'labels',
              display_options: {
                showAsDot: true,
                choices: [
                  { text: '$t:published', value: 'published', foreground: '#FFFFFF', background: '#2E7D32' },
                  { text: '$t:draft', value: 'draft', foreground: '#18222F', background: '#D3DAE4' },
                  { text: '$t:archived', value: 'archived', foreground: '#FFFFFF', background: '#F44336' },
                ],
              },
            },
          })
        );
        log.item('✓', `Updated ${collection}.status`);
        updatedCount++;
      }
    }

    // Update registration status fields (different values)
    log.info('Updating registration status fields...');
    for (const collection of COLLECTIONS_WITH_REGISTRATION_STATUS) {
      const key = `${collection}.status`;
      if (!fieldMap.has(key)) {
        log.warn(`  Skipping ${collection}.status - field not found`);
        continue;
      }

      if (options.dryRun) {
        log.item('~', `Would update ${collection}.status`);
      } else {
        await client.request(
          updateField(collection, 'status', {
            meta: {
              display: 'labels',
              display_options: {
                showAsDot: true,
                choices: [
                  { text: 'Registered', value: 'registered', foreground: '#FFFFFF', background: '#2E7D32' },
                  { text: 'Waitlist', value: 'waitlist', foreground: '#18222F', background: '#FFC107' },
                  { text: 'Cancelled', value: 'cancelled', foreground: '#FFFFFF', background: '#F44336' },
                ],
              },
            },
          })
        );
        log.item('✓', `Updated ${collection}.status`);
        updatedCount++;
      }
    }

    log.success(`Field display options updated! (${updatedCount} fields)`);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log.error(`Failed to update field display options: ${msg}`);
    throw error;
  }
}
