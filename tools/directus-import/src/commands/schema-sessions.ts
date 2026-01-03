import { readFile, writeFile } from 'node:fs/promises';

import { schemaApply, schemaDiff } from '@directus/sdk';

import { createClient } from '../services/directus';
import type { DirectusConfig, SchemaDiffResult } from '../types';
import { log } from '../utils';

export interface SchemaSessionsOptions {
  schemaPath: string;
  dryRun?: boolean;
  force?: boolean;
}

/**
 * Field definition helper
 */
interface FieldDef {
  collection: string;
  field: string;
  type: string;
  meta?: Record<string, unknown>;
  schema?: Record<string, unknown> | null;
}

/**
 * Relation definition helper
 */
interface RelationDef {
  collection: string;
  field: string;
  related_collection: string | null;
  meta?: Record<string, unknown>;
  schema?: Record<string, unknown> | null;
}

/**
 * Create standard audit fields (user_created, user_updated, date_created, date_updated)
 */
function createAuditFields(collection: string, startSort: number): {
  fields: FieldDef[];
  relations: RelationDef[];
} {
  const fields: FieldDef[] = [
    {
      collection,
      field: 'user_created',
      type: 'uuid',
      meta: {
        collection,
        field: 'user_created',
        hidden: true,
        interface: 'select-dropdown-m2o',
        display: 'user',
        readonly: true,
        sort: startSort,
        width: 'half',
        special: ['user-created'],
      },
      schema: {
        name: 'user_created',
        table: collection,
        data_type: 'uuid',
        is_nullable: true,
        foreign_key_table: 'directus_users',
        foreign_key_column: 'id',
      },
    },
    {
      collection,
      field: 'date_created',
      type: 'timestamp',
      meta: {
        collection,
        field: 'date_created',
        hidden: true,
        interface: 'datetime',
        display: 'datetime',
        readonly: true,
        sort: startSort + 1,
        width: 'half',
        special: ['date-created'],
      },
      schema: {
        name: 'date_created',
        table: collection,
        data_type: 'timestamp with time zone',
        is_nullable: true,
      },
    },
    {
      collection,
      field: 'user_updated',
      type: 'uuid',
      meta: {
        collection,
        field: 'user_updated',
        hidden: true,
        interface: 'select-dropdown-m2o',
        display: 'user',
        readonly: true,
        sort: startSort + 2,
        width: 'half',
        special: ['user-updated'],
      },
      schema: {
        name: 'user_updated',
        table: collection,
        data_type: 'uuid',
        is_nullable: true,
        foreign_key_table: 'directus_users',
        foreign_key_column: 'id',
      },
    },
    {
      collection,
      field: 'date_updated',
      type: 'timestamp',
      meta: {
        collection,
        field: 'date_updated',
        hidden: true,
        interface: 'datetime',
        display: 'datetime',
        readonly: true,
        sort: startSort + 3,
        width: 'half',
        special: ['date-updated'],
      },
      schema: {
        name: 'date_updated',
        table: collection,
        data_type: 'timestamp with time zone',
        is_nullable: true,
      },
    },
  ];

  const relations: RelationDef[] = [
    {
      collection,
      field: 'user_created',
      related_collection: 'directus_users',
      meta: {
        many_collection: collection,
        many_field: 'user_created',
        one_collection: 'directus_users',
        one_field: null,
        one_deselect_action: 'nullify',
      },
      schema: {
        table: collection,
        column: 'user_created',
        foreign_key_table: 'directus_users',
        foreign_key_column: 'id',
        on_delete: 'SET NULL',
        on_update: 'NO ACTION',
      },
    },
    {
      collection,
      field: 'user_updated',
      related_collection: 'directus_users',
      meta: {
        many_collection: collection,
        many_field: 'user_updated',
        one_collection: 'directus_users',
        one_field: null,
        one_deselect_action: 'nullify',
      },
      schema: {
        table: collection,
        column: 'user_updated',
        foreign_key_table: 'directus_users',
        foreign_key_column: 'id',
        on_delete: 'SET NULL',
        on_update: 'NO ACTION',
      },
    },
  ];

  return { fields, relations };
}

/**
 * Create user_profiles collection (1:1 with directus_users)
 */
function createUserProfilesCollection(): {
  collection: object;
  fields: FieldDef[];
  relations: RelationDef[];
} {
  const name = 'user_profiles';

  const collection = {
    collection: name,
    meta: {
      accountability: 'all',
      archive_app_filter: true,
      archive_field: null,
      archive_value: null,
      collapse: 'open',
      collection: name,
      color: null,
      display_template: '{{first_name}} {{last_name}}',
      group: null,
      hidden: false,
      icon: 'person',
      item_duplication_fields: null,
      note: 'User profile extension for directus_users',
      preview_url: null,
      singleton: false,
      sort: 1,
      sort_field: null,
      translations: null,
      unarchive_value: null,
      versioning: false,
    },
    schema: { name },
  };

  const fields: FieldDef[] = [
    // ID
    {
      collection: name,
      field: 'id',
      type: 'uuid',
      meta: {
        collection: name,
        field: 'id',
        hidden: true,
        interface: 'input',
        readonly: true,
        sort: 1,
        special: ['uuid'],
        width: 'full',
      },
      schema: {
        name: 'id',
        table: name,
        data_type: 'uuid',
        is_nullable: false,
        is_unique: true,
        is_primary_key: true,
      },
    },
    // FK to directus_users
    {
      collection: name,
      field: 'user_id',
      type: 'uuid',
      meta: {
        collection: name,
        field: 'user_id',
        hidden: false,
        interface: 'select-dropdown-m2o',
        display: 'related-values',
        display_options: { template: '{{email}}' },
        sort: 2,
        width: 'full',
        required: true,
      },
      schema: {
        name: 'user_id',
        table: name,
        data_type: 'uuid',
        is_nullable: false,
        is_unique: true,
        foreign_key_table: 'directus_users',
        foreign_key_column: 'id',
      },
    },
    // Basic data
    {
      collection: name,
      field: 'first_name',
      type: 'string',
      meta: {
        collection: name,
        field: 'first_name',
        hidden: false,
        interface: 'input',
        sort: 3,
        width: 'half',
        required: true,
      },
      schema: {
        name: 'first_name',
        table: name,
        data_type: 'character varying',
        max_length: 255,
        is_nullable: false,
      },
    },
    {
      collection: name,
      field: 'last_name',
      type: 'string',
      meta: {
        collection: name,
        field: 'last_name',
        hidden: false,
        interface: 'input',
        sort: 4,
        width: 'half',
        required: true,
      },
      schema: {
        name: 'last_name',
        table: name,
        data_type: 'character varying',
        max_length: 255,
        is_nullable: false,
      },
    },
    {
      collection: name,
      field: 'alias',
      type: 'string',
      meta: {
        collection: name,
        field: 'alias',
        hidden: false,
        interface: 'input',
        sort: 5,
        width: 'half',
        note: 'Public nickname (optional)',
      },
      schema: {
        name: 'alias',
        table: name,
        data_type: 'character varying',
        max_length: 255,
        is_nullable: true,
      },
    },
    {
      collection: name,
      field: 'phone',
      type: 'string',
      meta: {
        collection: name,
        field: 'phone',
        hidden: false,
        interface: 'input',
        sort: 6,
        width: 'half',
      },
      schema: {
        name: 'phone',
        table: name,
        data_type: 'character varying',
        max_length: 50,
        is_nullable: true,
      },
    },
    {
      collection: name,
      field: 'telegram_handle',
      type: 'string',
      meta: {
        collection: name,
        field: 'telegram_handle',
        hidden: false,
        interface: 'input',
        sort: 7,
        width: 'half',
      },
      schema: {
        name: 'telegram_handle',
        table: name,
        data_type: 'character varying',
        max_length: 255,
        is_nullable: true,
      },
    },
    // Pronouns (FK to pronouns collection)
    {
      collection: name,
      field: 'pronouns',
      type: 'uuid',
      meta: {
        collection: name,
        field: 'pronouns',
        hidden: false,
        interface: 'select-dropdown-m2o',
        display: 'related-values',
        display_options: { template: '{{identifier}}' },
        sort: 8,
        width: 'half',
        required: true,
      },
      schema: {
        name: 'pronouns',
        table: name,
        data_type: 'uuid',
        is_nullable: false,
        foreign_key_table: 'pronouns',
        foreign_key_column: 'id',
      },
    },
    {
      collection: name,
      field: 'pronouns_other',
      type: 'string',
      meta: {
        collection: name,
        field: 'pronouns_other',
        hidden: false,
        interface: 'input',
        sort: 9,
        width: 'half',
        note: 'Custom pronouns (when pronouns = other)',
      },
      schema: {
        name: 'pronouns_other',
        table: name,
        data_type: 'character varying',
        max_length: 255,
        is_nullable: true,
      },
    },
    // Event data divider
    {
      collection: name,
      field: 'divider_event_data',
      type: 'alias',
      meta: {
        collection: name,
        field: 'divider_event_data',
        hidden: false,
        interface: 'presentation-divider',
        sort: 10,
        width: 'full',
        options: { title: 'Event Data', icon: 'event' },
        special: ['alias', 'no-data'],
      },
      schema: null,
    },
    {
      collection: name,
      field: 'birth_date',
      type: 'date',
      meta: {
        collection: name,
        field: 'birth_date',
        hidden: false,
        interface: 'datetime',
        sort: 11,
        width: 'half',
      },
      schema: {
        name: 'birth_date',
        table: name,
        data_type: 'date',
        is_nullable: true,
      },
    },
    {
      collection: name,
      field: 'is_adult',
      type: 'boolean',
      meta: {
        collection: name,
        field: 'is_adult',
        hidden: false,
        interface: 'boolean',
        display: 'boolean',
        sort: 12,
        width: 'half',
      },
      schema: {
        name: 'is_adult',
        table: name,
        data_type: 'boolean',
        default_value: false,
        is_nullable: false,
      },
    },
    {
      collection: name,
      field: 'guardian_name',
      type: 'string',
      meta: {
        collection: name,
        field: 'guardian_name',
        hidden: false,
        interface: 'input',
        sort: 13,
        width: 'full',
        note: 'Required if user is a minor',
      },
      schema: {
        name: 'guardian_name',
        table: name,
        data_type: 'character varying',
        max_length: 255,
        is_nullable: true,
      },
    },
    {
      collection: name,
      field: 'accessibility_needs',
      type: 'text',
      meta: {
        collection: name,
        field: 'accessibility_needs',
        hidden: false,
        interface: 'input-multiline',
        sort: 14,
        width: 'full',
      },
      schema: {
        name: 'accessibility_needs',
        table: name,
        data_type: 'text',
        is_nullable: true,
      },
    },
    // Membership status (FK)
    {
      collection: name,
      field: 'membership_status',
      type: 'uuid',
      meta: {
        collection: name,
        field: 'membership_status',
        hidden: false,
        interface: 'select-dropdown-m2o',
        display: 'related-values',
        display_options: { template: '{{identifier}}' },
        sort: 15,
        width: 'full',
        required: true,
      },
      schema: {
        name: 'membership_status',
        table: name,
        data_type: 'uuid',
        is_nullable: false,
        foreign_key_table: 'membership_statuses',
        foreign_key_column: 'id',
      },
    },
    // Statistical indicators divider
    {
      collection: name,
      field: 'divider_stats',
      type: 'alias',
      meta: {
        collection: name,
        field: 'divider_stats',
        hidden: false,
        interface: 'presentation-divider',
        sort: 16,
        width: 'full',
        options: { title: 'Statistical Indicators (Optional)', icon: 'analytics' },
        special: ['alias', 'no-data'],
      },
      schema: null,
    },
    {
      collection: name,
      field: 'stats_completed',
      type: 'boolean',
      meta: {
        collection: name,
        field: 'stats_completed',
        hidden: false,
        interface: 'boolean',
        display: 'boolean',
        sort: 17,
        width: 'half',
      },
      schema: {
        name: 'stats_completed',
        table: name,
        data_type: 'boolean',
        default_value: false,
        is_nullable: false,
      },
    },
    {
      collection: name,
      field: 'nationality_ethnicity',
      type: 'string',
      meta: {
        collection: name,
        field: 'nationality_ethnicity',
        hidden: false,
        interface: 'input',
        sort: 18,
        width: 'half',
      },
      schema: {
        name: 'nationality_ethnicity',
        table: name,
        data_type: 'character varying',
        max_length: 255,
        is_nullable: true,
      },
    },
    // Gender identity (FK)
    {
      collection: name,
      field: 'gender_identity',
      type: 'uuid',
      meta: {
        collection: name,
        field: 'gender_identity',
        hidden: false,
        interface: 'select-dropdown-m2o',
        display: 'related-values',
        display_options: { template: '{{identifier}}' },
        sort: 19,
        width: 'half',
      },
      schema: {
        name: 'gender_identity',
        table: name,
        data_type: 'uuid',
        is_nullable: true,
        foreign_key_table: 'gender_identities',
        foreign_key_column: 'id',
      },
    },
    // LGBTIQ community (FK)
    {
      collection: name,
      field: 'lgbtiq_community',
      type: 'uuid',
      meta: {
        collection: name,
        field: 'lgbtiq_community',
        hidden: false,
        interface: 'select-dropdown-m2o',
        display: 'related-values',
        display_options: { template: '{{identifier}}' },
        sort: 20,
        width: 'half',
      },
      schema: {
        name: 'lgbtiq_community',
        table: name,
        data_type: 'uuid',
        is_nullable: true,
        foreign_key_table: 'lgbtiq_options',
        foreign_key_column: 'id',
      },
    },
    // Discovery sources (M2M alias)
    {
      collection: name,
      field: 'discovery_sources',
      type: 'alias',
      meta: {
        collection: name,
        field: 'discovery_sources',
        hidden: false,
        interface: 'list-m2m',
        display: 'related-values',
        display_options: { template: '{{discovery_sources_id.identifier}}' },
        sort: 21,
        width: 'full',
        special: ['m2m'],
      },
      schema: null,
    },
  ];

  // Add audit fields
  const auditFields = createAuditFields(name, 22);
  fields.push(...auditFields.fields);

  const relations: RelationDef[] = [
    // user_id → directus_users
    {
      collection: name,
      field: 'user_id',
      related_collection: 'directus_users',
      meta: {
        many_collection: name,
        many_field: 'user_id',
        one_collection: 'directus_users',
        one_field: null,
        one_deselect_action: 'nullify',
      },
      schema: {
        table: name,
        column: 'user_id',
        foreign_key_table: 'directus_users',
        foreign_key_column: 'id',
        on_delete: 'CASCADE',
        on_update: 'NO ACTION',
      },
    },
    // pronouns → pronouns
    {
      collection: name,
      field: 'pronouns',
      related_collection: 'pronouns',
      meta: {
        many_collection: name,
        many_field: 'pronouns',
        one_collection: 'pronouns',
        one_field: null,
        one_deselect_action: 'nullify',
      },
      schema: {
        table: name,
        column: 'pronouns',
        foreign_key_table: 'pronouns',
        foreign_key_column: 'id',
        on_delete: 'SET NULL',
        on_update: 'NO ACTION',
      },
    },
    // membership_status → membership_statuses
    {
      collection: name,
      field: 'membership_status',
      related_collection: 'membership_statuses',
      meta: {
        many_collection: name,
        many_field: 'membership_status',
        one_collection: 'membership_statuses',
        one_field: null,
        one_deselect_action: 'nullify',
      },
      schema: {
        table: name,
        column: 'membership_status',
        foreign_key_table: 'membership_statuses',
        foreign_key_column: 'id',
        on_delete: 'SET NULL',
        on_update: 'NO ACTION',
      },
    },
    // gender_identity → gender_identities
    {
      collection: name,
      field: 'gender_identity',
      related_collection: 'gender_identities',
      meta: {
        many_collection: name,
        many_field: 'gender_identity',
        one_collection: 'gender_identities',
        one_field: null,
        one_deselect_action: 'nullify',
      },
      schema: {
        table: name,
        column: 'gender_identity',
        foreign_key_table: 'gender_identities',
        foreign_key_column: 'id',
        on_delete: 'SET NULL',
        on_update: 'NO ACTION',
      },
    },
    // lgbtiq_community → lgbtiq_options
    {
      collection: name,
      field: 'lgbtiq_community',
      related_collection: 'lgbtiq_options',
      meta: {
        many_collection: name,
        many_field: 'lgbtiq_community',
        one_collection: 'lgbtiq_options',
        one_field: null,
        one_deselect_action: 'nullify',
      },
      schema: {
        table: name,
        column: 'lgbtiq_community',
        foreign_key_table: 'lgbtiq_options',
        foreign_key_column: 'id',
        on_delete: 'SET NULL',
        on_update: 'NO ACTION',
      },
    },
    // Add audit relations
    ...auditFields.relations,
  ];

  return { collection, fields, relations };
}

/**
 * Create M2M junction table for user_profiles ↔ discovery_sources
 */
function createUserProfilesDiscoverySourcesJunction(): {
  collection: object;
  fields: FieldDef[];
  relations: RelationDef[];
} {
  const name = 'user_profiles_discovery_sources';

  const collection = {
    collection: name,
    meta: {
      accountability: 'all',
      archive_app_filter: true,
      archive_field: null,
      archive_value: null,
      collapse: 'open',
      collection: name,
      color: null,
      display_template: null,
      group: 'user_profiles',
      hidden: true,
      icon: 'import_export',
      item_duplication_fields: null,
      note: null,
      preview_url: null,
      singleton: false,
      sort: 1,
      sort_field: null,
      translations: null,
      unarchive_value: null,
      versioning: false,
    },
    schema: { name },
  };

  const fields: FieldDef[] = [
    {
      collection: name,
      field: 'id',
      type: 'integer',
      meta: {
        collection: name,
        field: 'id',
        hidden: true,
        interface: 'input',
        sort: 1,
      },
      schema: {
        name: 'id',
        table: name,
        data_type: 'integer',
        is_nullable: false,
        is_primary_key: true,
        has_auto_increment: true,
      },
    },
    {
      collection: name,
      field: 'user_profiles_id',
      type: 'uuid',
      meta: {
        collection: name,
        field: 'user_profiles_id',
        hidden: true,
        sort: 2,
      },
      schema: {
        name: 'user_profiles_id',
        table: name,
        data_type: 'uuid',
        is_nullable: true,
        foreign_key_table: 'user_profiles',
        foreign_key_column: 'id',
      },
    },
    {
      collection: name,
      field: 'discovery_sources_id',
      type: 'uuid',
      meta: {
        collection: name,
        field: 'discovery_sources_id',
        hidden: true,
        sort: 3,
      },
      schema: {
        name: 'discovery_sources_id',
        table: name,
        data_type: 'uuid',
        is_nullable: true,
        foreign_key_table: 'discovery_sources',
        foreign_key_column: 'id',
      },
    },
  ];

  const relations: RelationDef[] = [
    {
      collection: name,
      field: 'user_profiles_id',
      related_collection: 'user_profiles',
      meta: {
        junction_field: 'discovery_sources_id',
        many_collection: name,
        many_field: 'user_profiles_id',
        one_collection: 'user_profiles',
        one_field: 'discovery_sources',
        one_deselect_action: 'nullify',
        sort_field: null,
      },
      schema: {
        table: name,
        column: 'user_profiles_id',
        foreign_key_table: 'user_profiles',
        foreign_key_column: 'id',
        on_delete: 'SET NULL',
        on_update: 'NO ACTION',
      },
    },
    {
      collection: name,
      field: 'discovery_sources_id',
      related_collection: 'discovery_sources',
      meta: {
        junction_field: 'user_profiles_id',
        many_collection: name,
        many_field: 'discovery_sources_id',
        one_collection: 'discovery_sources',
        one_field: null,
        one_deselect_action: 'nullify',
        sort_field: null,
      },
      schema: {
        table: name,
        column: 'discovery_sources_id',
        foreign_key_table: 'discovery_sources',
        foreign_key_column: 'id',
        on_delete: 'SET NULL',
        on_update: 'NO ACTION',
      },
    },
  ];

  return { collection, fields, relations };
}

/**
 * Create rpg_sessions collection with translations and M2M relations
 */
function createRpgSessionsCollection(): {
  collections: object[];
  fields: FieldDef[];
  relations: RelationDef[];
} {
  const name = 'rpg_sessions';
  const translationsName = `${name}_translations`;

  const mainCollection = {
    collection: name,
    meta: {
      accountability: 'all',
      archive_app_filter: true,
      archive_field: 'status',
      archive_value: 'archived',
      collapse: 'open',
      collection: name,
      color: null,
      display_template: '{{title}}',
      group: null,
      hidden: false,
      icon: 'sports_esports',
      item_duplication_fields: null,
      note: 'RPG game sessions offered by masters',
      preview_url: null,
      singleton: false,
      sort: 2,
      sort_field: 'sort',
      translations: null,
      unarchive_value: 'draft',
      versioning: false,
    },
    schema: { name },
  };

  const translationsCollection = {
    collection: translationsName,
    meta: {
      accountability: 'all',
      archive_app_filter: true,
      archive_field: null,
      archive_value: null,
      collapse: 'open',
      collection: translationsName,
      color: null,
      display_template: null,
      group: name,
      hidden: true,
      icon: 'import_export',
      item_duplication_fields: null,
      note: null,
      preview_url: null,
      singleton: false,
      sort: 1,
      sort_field: null,
      translations: null,
      unarchive_value: null,
      versioning: false,
    },
    schema: { name: translationsName },
  };

  const fields: FieldDef[] = [
    // Main collection fields
    {
      collection: name,
      field: 'id',
      type: 'uuid',
      meta: {
        collection: name,
        field: 'id',
        hidden: true,
        interface: 'input',
        readonly: true,
        sort: 1,
        special: ['uuid'],
        width: 'full',
      },
      schema: {
        name: 'id',
        table: name,
        data_type: 'uuid',
        is_nullable: false,
        is_unique: true,
        is_primary_key: true,
      },
    },
    {
      collection: name,
      field: 'identifier',
      type: 'string',
      meta: {
        collection: name,
        field: 'identifier',
        hidden: false,
        interface: 'input',
        display: 'formatted-value',
        display_options: {
          font: 'monospace',
          bold: true,
        },
        sort: 2,
        width: 'half',
        required: true,
        options: {
          slug: true,
          font: 'monospace',
          trim: true,
        },
      },
      schema: {
        name: 'identifier',
        table: name,
        data_type: 'character varying',
        max_length: 255,
        is_nullable: false,
        is_unique: true,
      },
    },
    {
      collection: name,
      field: 'status',
      type: 'string',
      meta: {
        collection: name,
        field: 'status',
        hidden: false,
        interface: 'select-dropdown',
        display: 'labels',
        display_options: {
          showAsDot: true,
          choices: [
            { text: '$t:published', value: 'published', foreground: '#FFFFFF', background: '#2E7D32' },
            { text: '$t:draft', value: 'draft', foreground: '#18222F', background: '#D3DAE4' },
            { text: '$t:archived', value: 'archived', foreground: '#FFFFFF', background: '#F44336' },
          ],
        },
        sort: 3,
        width: 'half',
        options: {
          choices: [
            { text: '$t:published', value: 'published' },
            { text: '$t:draft', value: 'draft' },
            { text: '$t:archived', value: 'archived' },
          ],
        },
      },
      schema: {
        name: 'status',
        table: name,
        data_type: 'character varying',
        max_length: 255,
        default_value: 'draft',
        is_nullable: false,
      },
    },
    {
      collection: name,
      field: 'sort',
      type: 'integer',
      meta: {
        collection: name,
        field: 'sort',
        hidden: true,
        interface: 'input',
        sort: 4,
      },
      schema: {
        name: 'sort',
        table: name,
        data_type: 'integer',
        is_nullable: true,
      },
    },
    {
      collection: name,
      field: 'title',
      type: 'string',
      meta: {
        collection: name,
        field: 'title',
        hidden: false,
        interface: 'input',
        sort: 5,
        width: 'full',
        required: true,
      },
      schema: {
        name: 'title',
        table: name,
        data_type: 'character varying',
        max_length: 255,
        is_nullable: false,
      },
    },
    {
      collection: name,
      field: 'slogan',
      type: 'string',
      meta: {
        collection: name,
        field: 'slogan',
        hidden: false,
        interface: 'input',
        sort: 6,
        width: 'full',
        note: 'Short tagline (max 50 chars)',
      },
      schema: {
        name: 'slogan',
        table: name,
        data_type: 'character varying',
        max_length: 50,
        is_nullable: true,
      },
    },
    {
      collection: name,
      field: 'synopsis',
      type: 'text',
      meta: {
        collection: name,
        field: 'synopsis',
        hidden: false,
        interface: 'input-rich-text-md',
        sort: 7,
        width: 'full',
      },
      schema: {
        name: 'synopsis',
        table: name,
        data_type: 'text',
        is_nullable: true,
      },
    },
    // Master (FK to directus_users)
    {
      collection: name,
      field: 'master_id',
      type: 'uuid',
      meta: {
        collection: name,
        field: 'master_id',
        hidden: false,
        interface: 'select-dropdown-m2o',
        display: 'related-values',
        display_options: { template: '{{email}}' },
        sort: 8,
        width: 'half',
        required: true,
      },
      schema: {
        name: 'master_id',
        table: name,
        data_type: 'uuid',
        is_nullable: false,
        foreign_key_table: 'directus_users',
        foreign_key_column: 'id',
      },
    },
    // Divider: Game System
    {
      collection: name,
      field: 'divider_game_system',
      type: 'alias',
      meta: {
        collection: name,
        field: 'divider_game_system',
        hidden: false,
        interface: 'presentation-divider',
        sort: 9,
        width: 'full',
        options: { title: 'Game System', icon: 'auto_stories' },
        special: ['alias', 'no-data'],
      },
      schema: null,
    },
    // rpg_system_id (FK)
    {
      collection: name,
      field: 'rpg_system_id',
      type: 'uuid',
      meta: {
        collection: name,
        field: 'rpg_system_id',
        hidden: false,
        interface: 'select-dropdown-m2o',
        display: 'related-values',
        display_options: { template: '{{identifier}}' },
        sort: 10,
        width: 'half',
      },
      schema: {
        name: 'rpg_system_id',
        table: name,
        data_type: 'uuid',
        is_nullable: true,
        foreign_key_table: 'rpg_systems',
        foreign_key_column: 'id',
      },
    },
    // rpg_edition_id (FK)
    {
      collection: name,
      field: 'rpg_edition_id',
      type: 'uuid',
      meta: {
        collection: name,
        field: 'rpg_edition_id',
        hidden: false,
        interface: 'select-dropdown-m2o',
        display: 'related-values',
        display_options: { template: '{{identifier}}' },
        sort: 11,
        width: 'half',
      },
      schema: {
        name: 'rpg_edition_id',
        table: name,
        data_type: 'uuid',
        is_nullable: true,
        foreign_key_table: 'rpg_editions',
        foreign_key_column: 'id',
      },
    },
    // setting_id (FK)
    {
      collection: name,
      field: 'setting_id',
      type: 'uuid',
      meta: {
        collection: name,
        field: 'setting_id',
        hidden: false,
        interface: 'select-dropdown-m2o',
        display: 'related-values',
        display_options: { template: '{{identifier}}' },
        sort: 12,
        width: 'half',
      },
      schema: {
        name: 'setting_id',
        table: name,
        data_type: 'uuid',
        is_nullable: true,
        foreign_key_table: 'settings',
        foreign_key_column: 'id',
      },
    },
    // Genres (M2M)
    {
      collection: name,
      field: 'genres',
      type: 'alias',
      meta: {
        collection: name,
        field: 'genres',
        hidden: false,
        interface: 'list-m2m',
        display: 'related-values',
        display_options: { template: '{{genres_id.identifier}}' },
        sort: 13,
        width: 'half',
        special: ['m2m'],
      },
      schema: null,
    },
    // Divider: Session Config
    {
      collection: name,
      field: 'divider_config',
      type: 'alias',
      meta: {
        collection: name,
        field: 'divider_config',
        hidden: false,
        interface: 'presentation-divider',
        sort: 14,
        width: 'full',
        options: { title: 'Session Configuration', icon: 'settings' },
        special: ['alias', 'no-data'],
      },
      schema: null,
    },
    // age_range (FK)
    {
      collection: name,
      field: 'age_range',
      type: 'uuid',
      meta: {
        collection: name,
        field: 'age_range',
        hidden: false,
        interface: 'select-dropdown-m2o',
        display: 'related-values',
        display_options: { template: '{{identifier}}' },
        sort: 15,
        width: 'half',
        required: true,
      },
      schema: {
        name: 'age_range',
        table: name,
        data_type: 'uuid',
        is_nullable: false,
        foreign_key_table: 'age_ranges',
        foreign_key_column: 'id',
      },
    },
    // knowledge_level (FK)
    {
      collection: name,
      field: 'knowledge_level',
      type: 'uuid',
      meta: {
        collection: name,
        field: 'knowledge_level',
        hidden: false,
        interface: 'select-dropdown-m2o',
        display: 'related-values',
        display_options: { template: '{{identifier}}' },
        sort: 16,
        width: 'half',
        required: true,
      },
      schema: {
        name: 'knowledge_level',
        table: name,
        data_type: 'uuid',
        is_nullable: false,
        foreign_key_table: 'knowledge_levels',
        foreign_key_column: 'id',
      },
    },
    {
      collection: name,
      field: 'knowledge_level_other',
      type: 'string',
      meta: {
        collection: name,
        field: 'knowledge_level_other',
        hidden: false,
        interface: 'input',
        sort: 17,
        width: 'full',
        note: 'Custom knowledge level description (when "other" is selected)',
      },
      schema: {
        name: 'knowledge_level_other',
        table: name,
        data_type: 'character varying',
        max_length: 255,
        is_nullable: true,
      },
    },
    // Player count
    {
      collection: name,
      field: 'min_players',
      type: 'integer',
      meta: {
        collection: name,
        field: 'min_players',
        hidden: false,
        interface: 'input',
        sort: 18,
        width: 'half',
        required: true,
      },
      schema: {
        name: 'min_players',
        table: name,
        data_type: 'integer',
        default_value: 2,
        is_nullable: false,
      },
    },
    {
      collection: name,
      field: 'max_players',
      type: 'integer',
      meta: {
        collection: name,
        field: 'max_players',
        hidden: false,
        interface: 'input',
        sort: 19,
        width: 'half',
        required: true,
      },
      schema: {
        name: 'max_players',
        table: name,
        data_type: 'integer',
        default_value: 6,
        is_nullable: false,
      },
    },
    // Duration
    {
      collection: name,
      field: 'min_duration_minutes',
      type: 'integer',
      meta: {
        collection: name,
        field: 'min_duration_minutes',
        hidden: false,
        interface: 'input',
        sort: 20,
        width: 'half',
        required: true,
      },
      schema: {
        name: 'min_duration_minutes',
        table: name,
        data_type: 'integer',
        default_value: 120,
        is_nullable: false,
      },
    },
    {
      collection: name,
      field: 'max_duration_minutes',
      type: 'integer',
      meta: {
        collection: name,
        field: 'max_duration_minutes',
        hidden: false,
        interface: 'input',
        sort: 21,
        width: 'half',
        required: true,
      },
      schema: {
        name: 'max_duration_minutes',
        table: name,
        data_type: 'integer',
        default_value: 240,
        is_nullable: false,
      },
    },
    // Current players (calculated)
    {
      collection: name,
      field: 'current_players',
      type: 'integer',
      meta: {
        collection: name,
        field: 'current_players',
        hidden: false,
        interface: 'input',
        readonly: true,
        sort: 22,
        width: 'half',
        note: 'Auto-calculated from registrations',
      },
      schema: {
        name: 'current_players',
        table: name,
        data_type: 'integer',
        default_value: 0,
        is_nullable: false,
      },
    },
    // Divider: Accessibility & Safety
    {
      collection: name,
      field: 'divider_safety',
      type: 'alias',
      meta: {
        collection: name,
        field: 'divider_safety',
        hidden: false,
        interface: 'presentation-divider',
        sort: 23,
        width: 'full',
        options: { title: 'Accessibility & Safety', icon: 'accessibility' },
        special: ['alias', 'no-data'],
      },
      schema: null,
    },
    // M2M relations (aliases)
    {
      collection: name,
      field: 'accessibility_options',
      type: 'alias',
      meta: {
        collection: name,
        field: 'accessibility_options',
        hidden: false,
        interface: 'list-m2m',
        display: 'related-values',
        display_options: { template: '{{accessibility_options_id.identifier}}' },
        sort: 24,
        width: 'half',
        special: ['m2m'],
      },
      schema: null,
    },
    {
      collection: name,
      field: 'languages',
      type: 'alias',
      meta: {
        collection: name,
        field: 'languages',
        hidden: false,
        interface: 'list-m2m',
        display: 'related-values',
        display_options: { template: '{{session_languages_id.identifier}}' },
        sort: 25,
        width: 'half',
        special: ['m2m'],
      },
      schema: null,
    },
    {
      collection: name,
      field: 'content_warnings',
      type: 'alias',
      meta: {
        collection: name,
        field: 'content_warnings',
        hidden: false,
        interface: 'list-m2m',
        display: 'related-values',
        display_options: { template: '{{content_warnings_id.identifier}}' },
        sort: 26,
        width: 'half',
        special: ['m2m'],
      },
      schema: null,
    },
    {
      collection: name,
      field: 'safety_measures',
      type: 'alias',
      meta: {
        collection: name,
        field: 'safety_measures',
        hidden: false,
        interface: 'list-m2m',
        display: 'related-values',
        display_options: { template: '{{safety_measures_id.identifier}}' },
        sort: 27,
        width: 'half',
        special: ['m2m'],
      },
      schema: null,
    },
    {
      collection: name,
      field: 'comments',
      type: 'text',
      meta: {
        collection: name,
        field: 'comments',
        hidden: false,
        interface: 'input-multiline',
        sort: 28,
        width: 'full',
      },
      schema: {
        name: 'comments',
        table: name,
        data_type: 'text',
        is_nullable: true,
      },
    },
    // Translations alias
    {
      collection: name,
      field: 'translations',
      type: 'alias',
      meta: {
        collection: name,
        field: 'translations',
        hidden: false,
        interface: 'translations',
        sort: 29,
        special: ['translations'],
        options: { languageField: 'code' },
      },
      schema: null,
    },
    // Players alias (O2M)
    {
      collection: name,
      field: 'players',
      type: 'alias',
      meta: {
        collection: name,
        field: 'players',
        hidden: false,
        interface: 'list-o2m',
        display: 'related-values',
        display_options: { template: '{{user_id.email}} - {{status}}' },
        sort: 30,
        width: 'full',
        special: ['o2m'],
      },
      schema: null,
    },
    // Audit fields for rpg_sessions
    ...createAuditFields(name, 31).fields,

    // Translation fields
    {
      collection: translationsName,
      field: 'id',
      type: 'integer',
      meta: {
        collection: translationsName,
        field: 'id',
        hidden: true,
        interface: 'input',
        sort: 1,
      },
      schema: {
        name: 'id',
        table: translationsName,
        data_type: 'integer',
        is_nullable: false,
        is_primary_key: true,
        has_auto_increment: true,
      },
    },
    {
      collection: translationsName,
      field: 'rpg_sessions_id',
      type: 'uuid',
      meta: {
        collection: translationsName,
        field: 'rpg_sessions_id',
        hidden: true,
        sort: 2,
      },
      schema: {
        name: 'rpg_sessions_id',
        table: translationsName,
        data_type: 'uuid',
        is_nullable: true,
        foreign_key_table: name,
        foreign_key_column: 'id',
      },
    },
    {
      collection: translationsName,
      field: 'languages_code',
      type: 'string',
      meta: {
        collection: translationsName,
        field: 'languages_code',
        hidden: true,
        sort: 3,
      },
      schema: {
        name: 'languages_code',
        table: translationsName,
        data_type: 'character varying',
        max_length: 255,
        is_nullable: true,
        foreign_key_table: 'languages',
        foreign_key_column: 'code',
      },
    },
    {
      collection: translationsName,
      field: 'title',
      type: 'string',
      meta: {
        collection: translationsName,
        field: 'title',
        hidden: false,
        interface: 'input',
        sort: 4,
        width: 'full',
      },
      schema: {
        name: 'title',
        table: translationsName,
        data_type: 'character varying',
        max_length: 255,
        is_nullable: true,
      },
    },
    {
      collection: translationsName,
      field: 'slogan',
      type: 'string',
      meta: {
        collection: translationsName,
        field: 'slogan',
        hidden: false,
        interface: 'input',
        sort: 5,
        width: 'full',
      },
      schema: {
        name: 'slogan',
        table: translationsName,
        data_type: 'character varying',
        max_length: 50,
        is_nullable: true,
      },
    },
    {
      collection: translationsName,
      field: 'synopsis',
      type: 'text',
      meta: {
        collection: translationsName,
        field: 'synopsis',
        hidden: false,
        interface: 'input-rich-text-md',
        sort: 6,
        width: 'full',
      },
      schema: {
        name: 'synopsis',
        table: translationsName,
        data_type: 'text',
        is_nullable: true,
      },
    },
  ];

  const relations: RelationDef[] = [
    // Translations relations
    {
      collection: translationsName,
      field: 'rpg_sessions_id',
      related_collection: name,
      meta: {
        junction_field: 'languages_code',
        many_collection: translationsName,
        many_field: 'rpg_sessions_id',
        one_collection: name,
        one_field: 'translations',
        one_deselect_action: 'nullify',
        sort_field: null,
      },
      schema: {
        table: translationsName,
        column: 'rpg_sessions_id',
        foreign_key_table: name,
        foreign_key_column: 'id',
        on_delete: 'SET NULL',
        on_update: 'NO ACTION',
      },
    },
    {
      collection: translationsName,
      field: 'languages_code',
      related_collection: 'languages',
      meta: {
        junction_field: 'rpg_sessions_id',
        many_collection: translationsName,
        many_field: 'languages_code',
        one_collection: 'languages',
        one_field: null,
        one_deselect_action: 'nullify',
        sort_field: null,
      },
      schema: {
        table: translationsName,
        column: 'languages_code',
        foreign_key_table: 'languages',
        foreign_key_column: 'code',
        on_delete: 'SET NULL',
        on_update: 'NO ACTION',
      },
    },
    // FK relations
    {
      collection: name,
      field: 'master_id',
      related_collection: 'directus_users',
      meta: {
        many_collection: name,
        many_field: 'master_id',
        one_collection: 'directus_users',
        one_field: null,
        one_deselect_action: 'nullify',
      },
      schema: {
        table: name,
        column: 'master_id',
        foreign_key_table: 'directus_users',
        foreign_key_column: 'id',
        on_delete: 'SET NULL',
        on_update: 'NO ACTION',
      },
    },
    {
      collection: name,
      field: 'rpg_system_id',
      related_collection: 'rpg_systems',
      meta: {
        many_collection: name,
        many_field: 'rpg_system_id',
        one_collection: 'rpg_systems',
        one_field: null,
        one_deselect_action: 'nullify',
      },
      schema: {
        table: name,
        column: 'rpg_system_id',
        foreign_key_table: 'rpg_systems',
        foreign_key_column: 'id',
        on_delete: 'SET NULL',
        on_update: 'NO ACTION',
      },
    },
    {
      collection: name,
      field: 'rpg_edition_id',
      related_collection: 'rpg_editions',
      meta: {
        many_collection: name,
        many_field: 'rpg_edition_id',
        one_collection: 'rpg_editions',
        one_field: null,
        one_deselect_action: 'nullify',
      },
      schema: {
        table: name,
        column: 'rpg_edition_id',
        foreign_key_table: 'rpg_editions',
        foreign_key_column: 'id',
        on_delete: 'SET NULL',
        on_update: 'NO ACTION',
      },
    },
    {
      collection: name,
      field: 'setting_id',
      related_collection: 'settings',
      meta: {
        many_collection: name,
        many_field: 'setting_id',
        one_collection: 'settings',
        one_field: null,
        one_deselect_action: 'nullify',
      },
      schema: {
        table: name,
        column: 'setting_id',
        foreign_key_table: 'settings',
        foreign_key_column: 'id',
        on_delete: 'SET NULL',
        on_update: 'NO ACTION',
      },
    },
    {
      collection: name,
      field: 'age_range',
      related_collection: 'age_ranges',
      meta: {
        many_collection: name,
        many_field: 'age_range',
        one_collection: 'age_ranges',
        one_field: null,
        one_deselect_action: 'nullify',
      },
      schema: {
        table: name,
        column: 'age_range',
        foreign_key_table: 'age_ranges',
        foreign_key_column: 'id',
        on_delete: 'SET NULL',
        on_update: 'NO ACTION',
      },
    },
    {
      collection: name,
      field: 'knowledge_level',
      related_collection: 'knowledge_levels',
      meta: {
        many_collection: name,
        many_field: 'knowledge_level',
        one_collection: 'knowledge_levels',
        one_field: null,
        one_deselect_action: 'nullify',
      },
      schema: {
        table: name,
        column: 'knowledge_level',
        foreign_key_table: 'knowledge_levels',
        foreign_key_column: 'id',
        on_delete: 'SET NULL',
        on_update: 'NO ACTION',
      },
    },
    // Audit relations for rpg_sessions
    ...createAuditFields(name, 31).relations,
  ];

  return { collections: [mainCollection, translationsCollection], fields, relations };
}

/**
 * Create M2M junction tables for rpg_sessions
 */
function createRpgSessionsM2MJunctions(): {
  collections: object[];
  fields: FieldDef[];
  relations: RelationDef[];
} {
  const junctions = [
    { name: 'rpg_sessions_genres', target: 'genres', targetField: 'genres_id' },
    { name: 'rpg_sessions_accessibility_options', target: 'accessibility_options', targetField: 'accessibility_options_id' },
    { name: 'rpg_sessions_session_languages', target: 'session_languages', targetField: 'session_languages_id' },
    { name: 'rpg_sessions_content_warnings', target: 'content_warnings', targetField: 'content_warnings_id' },
    { name: 'rpg_sessions_safety_measures', target: 'safety_measures', targetField: 'safety_measures_id' },
  ];

  const collections: object[] = [];
  const fields: FieldDef[] = [];
  const relations: RelationDef[] = [];

  for (const { name, target, targetField } of junctions) {
    // Collection
    collections.push({
      collection: name,
      meta: {
        accountability: 'all',
        archive_app_filter: true,
        archive_field: null,
        archive_value: null,
        collapse: 'open',
        collection: name,
        color: null,
        display_template: null,
        group: 'rpg_sessions',
        hidden: true,
        icon: 'import_export',
        item_duplication_fields: null,
        note: null,
        preview_url: null,
        singleton: false,
        sort: 1,
        sort_field: null,
        translations: null,
        unarchive_value: null,
        versioning: false,
      },
      schema: { name },
    });

    // Fields
    fields.push(
      {
        collection: name,
        field: 'id',
        type: 'integer',
        meta: {
          collection: name,
          field: 'id',
          hidden: true,
          interface: 'input',
          sort: 1,
        },
        schema: {
          name: 'id',
          table: name,
          data_type: 'integer',
          is_nullable: false,
          is_primary_key: true,
          has_auto_increment: true,
        },
      },
      {
        collection: name,
        field: 'rpg_sessions_id',
        type: 'uuid',
        meta: {
          collection: name,
          field: 'rpg_sessions_id',
          hidden: true,
          sort: 2,
        },
        schema: {
          name: 'rpg_sessions_id',
          table: name,
          data_type: 'uuid',
          is_nullable: true,
          foreign_key_table: 'rpg_sessions',
          foreign_key_column: 'id',
        },
      },
      {
        collection: name,
        field: targetField,
        type: 'uuid',
        meta: {
          collection: name,
          field: targetField,
          hidden: true,
          sort: 3,
        },
        schema: {
          name: targetField,
          table: name,
          data_type: 'uuid',
          is_nullable: true,
          foreign_key_table: target,
          foreign_key_column: 'id',
        },
      }
    );

    // Get the alias field name (e.g., "genres", "accessibility_options")
    const aliasField = target === 'session_languages' ? 'languages' : target;

    // Relations
    relations.push(
      {
        collection: name,
        field: 'rpg_sessions_id',
        related_collection: 'rpg_sessions',
        meta: {
          junction_field: targetField,
          many_collection: name,
          many_field: 'rpg_sessions_id',
          one_collection: 'rpg_sessions',
          one_field: aliasField,
          one_deselect_action: 'nullify',
          sort_field: null,
        },
        schema: {
          table: name,
          column: 'rpg_sessions_id',
          foreign_key_table: 'rpg_sessions',
          foreign_key_column: 'id',
          on_delete: 'SET NULL',
          on_update: 'NO ACTION',
        },
      },
      {
        collection: name,
        field: targetField,
        related_collection: target,
        meta: {
          junction_field: 'rpg_sessions_id',
          many_collection: name,
          many_field: targetField,
          one_collection: target,
          one_field: null,
          one_deselect_action: 'nullify',
          sort_field: null,
        },
        schema: {
          table: name,
          column: targetField,
          foreign_key_table: target,
          foreign_key_column: 'id',
          on_delete: 'SET NULL',
          on_update: 'NO ACTION',
        },
      }
    );
  }

  return { collections, fields, relations };
}

/**
 * Create rpg_session_players collection (registrations)
 */
function createRpgSessionPlayersCollection(): {
  collection: object;
  fields: FieldDef[];
  relations: RelationDef[];
} {
  const name = 'rpg_session_players';

  const collection = {
    collection: name,
    meta: {
      accountability: 'all',
      archive_app_filter: true,
      archive_field: null,
      archive_value: null,
      collapse: 'open',
      collection: name,
      color: null,
      display_template: '{{user_id.email}} - {{status}}',
      group: 'rpg_sessions',
      hidden: false,
      icon: 'group',
      item_duplication_fields: null,
      note: 'Player registrations for sessions',
      preview_url: null,
      singleton: false,
      sort: 2,
      sort_field: null,
      translations: null,
      unarchive_value: null,
      versioning: false,
    },
    schema: { name },
  };

  const fields: FieldDef[] = [
    {
      collection: name,
      field: 'id',
      type: 'integer',
      meta: {
        collection: name,
        field: 'id',
        hidden: true,
        interface: 'input',
        sort: 1,
      },
      schema: {
        name: 'id',
        table: name,
        data_type: 'integer',
        is_nullable: false,
        is_primary_key: true,
        has_auto_increment: true,
      },
    },
    {
      collection: name,
      field: 'session_id',
      type: 'uuid',
      meta: {
        collection: name,
        field: 'session_id',
        hidden: false,
        interface: 'select-dropdown-m2o',
        display: 'related-values',
        display_options: { template: '{{title}}' },
        sort: 2,
        width: 'half',
        required: true,
      },
      schema: {
        name: 'session_id',
        table: name,
        data_type: 'uuid',
        is_nullable: false,
        foreign_key_table: 'rpg_sessions',
        foreign_key_column: 'id',
      },
    },
    {
      collection: name,
      field: 'user_id',
      type: 'uuid',
      meta: {
        collection: name,
        field: 'user_id',
        hidden: false,
        interface: 'select-dropdown-m2o',
        display: 'related-values',
        display_options: { template: '{{email}}' },
        sort: 3,
        width: 'half',
        required: true,
      },
      schema: {
        name: 'user_id',
        table: name,
        data_type: 'uuid',
        is_nullable: false,
        foreign_key_table: 'directus_users',
        foreign_key_column: 'id',
      },
    },
    {
      collection: name,
      field: 'status',
      type: 'string',
      meta: {
        collection: name,
        field: 'status',
        hidden: false,
        interface: 'select-dropdown',
        display: 'labels',
        display_options: {
          showAsDot: true,
          choices: [
            { text: 'Registered', value: 'registered', foreground: '#FFFFFF', background: '#2E7D32' },
            { text: 'Waitlist', value: 'waitlist', foreground: '#18222F', background: '#FFC107' },
            { text: 'Cancelled', value: 'cancelled', foreground: '#FFFFFF', background: '#F44336' },
          ],
        },
        sort: 4,
        width: 'half',
        options: {
          choices: [
            { text: 'Registered', value: 'registered' },
            { text: 'Waitlist', value: 'waitlist' },
            { text: 'Cancelled', value: 'cancelled' },
          ],
        },
      },
      schema: {
        name: 'status',
        table: name,
        data_type: 'character varying',
        max_length: 50,
        default_value: 'registered',
        is_nullable: false,
      },
    },
    {
      collection: name,
      field: 'registered_at',
      type: 'timestamp',
      meta: {
        collection: name,
        field: 'registered_at',
        hidden: false,
        interface: 'datetime',
        display: 'datetime',
        sort: 5,
        width: 'half',
        readonly: true,
        special: ['date-created'],
      },
      schema: {
        name: 'registered_at',
        table: name,
        data_type: 'timestamp with time zone',
        is_nullable: true,
      },
    },
  ];

  const relations: RelationDef[] = [
    {
      collection: name,
      field: 'session_id',
      related_collection: 'rpg_sessions',
      meta: {
        many_collection: name,
        many_field: 'session_id',
        one_collection: 'rpg_sessions',
        one_field: 'players',
        one_deselect_action: 'nullify',
      },
      schema: {
        table: name,
        column: 'session_id',
        foreign_key_table: 'rpg_sessions',
        foreign_key_column: 'id',
        on_delete: 'CASCADE',
        on_update: 'NO ACTION',
      },
    },
    {
      collection: name,
      field: 'user_id',
      related_collection: 'directus_users',
      meta: {
        many_collection: name,
        many_field: 'user_id',
        one_collection: 'directus_users',
        one_field: null,
        one_deselect_action: 'nullify',
      },
      schema: {
        table: name,
        column: 'user_id',
        foreign_key_table: 'directus_users',
        foreign_key_column: 'id',
        on_delete: 'CASCADE',
        on_update: 'NO ACTION',
      },
    },
  ];

  return { collection, fields, relations };
}

/**
 * Setup main collections for rpg_sessions feature
 */
export async function schemaSessionsCommand(
  config: DirectusConfig,
  options: SchemaSessionsOptions
): Promise<void> {
  const client = await createClient(config);

  log.header('SCHEMA SETUP - RPG Sessions & User Profiles');
  log.summary(`Schema file: ${options.schemaPath}`);
  if (options.dryRun) {
    log.warn('DRY RUN - Changes will be saved to file but not applied');
  }

  try {
    // Read existing schema
    log.info('Reading existing schema...');
    const content = await readFile(options.schemaPath, 'utf-8');
    const schema = JSON.parse(content);

    const existingCollections = new Set(
      schema.collections.map((c: { collection: string }) => c.collection)
    );

    // Track what we add
    const addedCollections: string[] = [];

    // 1. User Profiles
    if (!existingCollections.has('user_profiles')) {
      const userProfiles = createUserProfilesCollection();
      schema.collections.push(userProfiles.collection);
      schema.fields.push(...userProfiles.fields);
      schema.relations.push(...userProfiles.relations);
      addedCollections.push('user_profiles');
      log.item('created', 'user_profiles');

      // Add M2M junction for discovery sources
      const discoverySources = createUserProfilesDiscoverySourcesJunction();
      schema.collections.push(discoverySources.collection);
      schema.fields.push(...discoverySources.fields);
      schema.relations.push(...discoverySources.relations);
      addedCollections.push('user_profiles_discovery_sources');
      log.item('created', 'user_profiles_discovery_sources (M2M junction)');
    } else {
      log.warn('Skipping user_profiles - already exists');
    }

    // 2. RPG Sessions
    if (!existingCollections.has('rpg_sessions')) {
      const rpgSessions = createRpgSessionsCollection();
      schema.collections.push(...rpgSessions.collections);
      schema.fields.push(...rpgSessions.fields);
      schema.relations.push(...rpgSessions.relations);
      addedCollections.push('rpg_sessions', 'rpg_sessions_translations');
      log.item('created', 'rpg_sessions');
      log.item('created', 'rpg_sessions_translations');

      // Add M2M junction tables
      const m2mJunctions = createRpgSessionsM2MJunctions();
      schema.collections.push(...m2mJunctions.collections);
      schema.fields.push(...m2mJunctions.fields);
      schema.relations.push(...m2mJunctions.relations);
      for (const c of m2mJunctions.collections) {
        const col = c as { collection: string };
        addedCollections.push(col.collection);
        log.item('created', `${col.collection} (M2M junction)`);
      }

      // Add rpg_session_players
      const players = createRpgSessionPlayersCollection();
      schema.collections.push(players.collection);
      schema.fields.push(...players.fields);
      schema.relations.push(...players.relations);
      addedCollections.push('rpg_session_players');
      log.item('created', 'rpg_session_players');
    } else {
      log.warn('Skipping rpg_sessions - already exists');
    }

    if (addedCollections.length === 0) {
      log.success('All collections already exist. No changes needed.');
      return;
    }

    // Write updated schema to file
    const outputPath = options.schemaPath.replace('.json', '-with-sessions.json');
    await writeFile(outputPath, JSON.stringify(schema, null, 2), 'utf-8');
    log.success(`Schema saved to: ${outputPath}`);

    if (options.dryRun) {
      log.warn('DRY RUN complete. Review the file and run schema-import to apply.');
      return;
    }

    // Apply the schema
    log.info('Applying schema changes to Directus...');
    const diffResult = await client.request(
      schemaDiff(schema, options.force)
    ) as SchemaDiffResult;

    const { diff } = diffResult;
    const totalChanges =
      (diff.collections?.length ?? 0) +
      (diff.fields?.length ?? 0) +
      (diff.relations?.length ?? 0);

    if (totalChanges === 0) {
      log.success('Schema is already up to date. No changes needed.');
      return;
    }

    log.info(`Applying ${totalChanges} changes...`);
    await client.request(schemaApply(diffResult));

    log.success('Schema setup completed successfully!');
    log.summary(`Added ${addedCollections.length} collections:`);
    for (const name of addedCollections) {
      log.item('✓', name);
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log.error(`Failed to setup schema: ${msg}`);
    throw error;
  }
}
