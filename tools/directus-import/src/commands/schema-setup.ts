import { readFile, writeFile } from 'node:fs/promises';

import { schemaApply, schemaDiff } from '@directus/sdk';

import { createClient } from '../services/directus';
import type { DirectusConfig, SchemaDiffResult } from '../types';
import { log } from '../utils';

export interface SchemaSetupOptions {
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
  schema?: Record<string, unknown>;
}

/**
 * Create a simple enum collection with translations
 */
function createSimpleEnumCollection(
  name: string,
  group: string,
  sort: number
): { collection: object; translationCollection: object; fields: FieldDef[]; translationFields: FieldDef[]; relations: object[] } {
  const translationName = `${name}_translations`;

  const collection = {
    collection: name,
    meta: {
      accountability: 'all',
      archive_app_filter: true,
      archive_field: 'status',
      archive_value: 'archived',
      collapse: 'open',
      collection: name,
      color: null,
      display_template: '{{identifier}}',
      group,
      hidden: false,
      icon: null,
      item_duplication_fields: null,
      note: null,
      preview_url: null,
      singleton: false,
      sort,
      sort_field: 'sort',
      translations: null,
      unarchive_value: 'draft',
      versioning: false,
    },
    schema: { name },
  };

  const translationCollection = {
    collection: translationName,
    meta: {
      accountability: 'all',
      archive_app_filter: true,
      archive_field: null,
      archive_value: null,
      collapse: 'open',
      collection: translationName,
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
    schema: { name: translationName },
  };

  // Base entity fields
  const fields: FieldDef[] = [
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
        width: 'full',
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
        width: 'full',
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
        default_value: 'published',
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
      field: 'translations',
      type: 'alias',
      meta: {
        collection: name,
        field: 'translations',
        hidden: false,
        interface: 'translations',
        sort: 5,
        special: ['translations'],
        options: { languageField: 'code' },
      },
    },
  ];

  // Translation fields
  const translationFields: FieldDef[] = [
    {
      collection: translationName,
      field: 'id',
      type: 'integer',
      meta: {
        collection: translationName,
        field: 'id',
        hidden: true,
        interface: 'input',
        sort: 1,
      },
      schema: {
        name: 'id',
        table: translationName,
        data_type: 'integer',
        is_nullable: false,
        is_primary_key: true,
        has_auto_increment: true,
      },
    },
    {
      collection: translationName,
      field: `${name}_id`,
      type: 'uuid',
      meta: {
        collection: translationName,
        field: `${name}_id`,
        hidden: true,
        sort: 2,
      },
      schema: {
        name: `${name}_id`,
        table: translationName,
        data_type: 'uuid',
        is_nullable: true,
        foreign_key_table: name,
        foreign_key_column: 'id',
      },
    },
    {
      collection: translationName,
      field: 'languages_code',
      type: 'string',
      meta: {
        collection: translationName,
        field: 'languages_code',
        hidden: true,
        sort: 3,
      },
      schema: {
        name: 'languages_code',
        table: translationName,
        data_type: 'character varying',
        max_length: 255,
        is_nullable: true,
        foreign_key_table: 'languages',
        foreign_key_column: 'code',
      },
    },
    {
      collection: translationName,
      field: 'name',
      type: 'string',
      meta: {
        collection: translationName,
        field: 'name',
        hidden: false,
        interface: 'input',
        sort: 4,
        width: 'full',
      },
      schema: {
        name: 'name',
        table: translationName,
        data_type: 'character varying',
        max_length: 255,
        is_nullable: true,
      },
    },
  ];

  // Relations
  const relations = [
    {
      collection: translationName,
      field: `${name}_id`,
      related_collection: name,
      meta: {
        junction_field: 'languages_code',
        many_collection: translationName,
        many_field: `${name}_id`,
        one_allowed_collections: null,
        one_collection: name,
        one_collection_field: null,
        one_deselect_action: 'nullify',
        one_field: 'translations',
        sort_field: null,
      },
      schema: {
        table: translationName,
        column: `${name}_id`,
        foreign_key_table: name,
        foreign_key_column: 'id',
        on_delete: 'SET NULL',
        on_update: 'NO ACTION',
      },
    },
    {
      collection: translationName,
      field: 'languages_code',
      related_collection: 'languages',
      meta: {
        junction_field: `${name}_id`,
        many_collection: translationName,
        many_field: 'languages_code',
        one_allowed_collections: null,
        one_collection: 'languages',
        one_collection_field: null,
        one_deselect_action: 'nullify',
        one_field: null,
        sort_field: null,
      },
      schema: {
        table: translationName,
        column: 'languages_code',
        foreign_key_table: 'languages',
        foreign_key_column: 'code',
        on_delete: 'SET NULL',
        on_update: 'NO ACTION',
      },
    },
  ];

  return { collection, translationCollection, fields, translationFields, relations };
}

/**
 * Create described enum (with description field in translations)
 */
function createDescribedEnumCollection(name: string, group: string, sort: number) {
  const result = createSimpleEnumCollection(name, group, sort);
  const translationName = `${name}_translations`;

  // Add description field to translations
  result.translationFields.push({
    collection: translationName,
    field: 'description',
    type: 'text',
    meta: {
      collection: translationName,
      field: 'description',
      hidden: false,
      interface: 'input-multiline',
      sort: 5,
      width: 'full',
    },
    schema: {
      name: 'description',
      table: translationName,
      data_type: 'text',
      is_nullable: true,
    },
  });

  return result;
}

/**
 * Setup schema for rpg_sessions feature
 */
export async function schemaSetupCommand(
  config: DirectusConfig,
  options: SchemaSetupOptions
): Promise<void> {
  const client = await createClient(config);

  log.header('SCHEMA SETUP - RPG Sessions');
  log.summary(`Schema file: ${options.schemaPath}`);
  if (options.dryRun) {
    log.warn('DRY RUN - Changes will be saved to file but not applied');
  }

  try {
    // Read existing schema
    log.info('Reading existing schema...');
    const content = await readFile(options.schemaPath, 'utf-8');
    const schema = JSON.parse(content);

    // Check if auxiliary collections already exist
    const existingCollections = new Set(
      schema.collections.map((c: { collection: string }) => c.collection)
    );

    // Create folder group for auxiliary collections
    if (!existingCollections.has('auxiliary')) {
      schema.collections.push({
        collection: 'auxiliary',
        meta: {
          accountability: 'all',
          archive_app_filter: true,
          archive_field: null,
          archive_value: null,
          collapse: 'open',
          collection: 'auxiliary',
          color: null,
          display_template: null,
          group: null,
          hidden: false,
          icon: 'folder',
          item_duplication_fields: null,
          note: 'Enum-like collections for rpg_sessions',
          preview_url: null,
          singleton: false,
          sort: 10,
          sort_field: null,
          translations: null,
          unarchive_value: null,
          versioning: false,
        },
      });
      log.item('created', 'auxiliary (folder group)');
    }

    // Simple enum collections
    const simpleEnums = [
      'age_ranges',
      'session_languages',
      'pronouns',
      'membership_statuses',
      'gender_identities',
      'lgbtiq_options',
      'discovery_sources',
    ];

    // Described enum collections
    const describedEnums = [
      'knowledge_levels',
      'accessibility_options',
      'content_warnings',
      'safety_measures',
    ];

    let sortOrder = 1;

    // Add simple enum collections
    for (const name of simpleEnums) {
      if (existingCollections.has(name)) {
        log.warn(`Skipping ${name} - already exists`);
        continue;
      }

      const { collection, translationCollection, fields, translationFields, relations } =
        createSimpleEnumCollection(name, 'auxiliary', sortOrder++);

      schema.collections.push(collection, translationCollection);
      schema.fields.push(...fields, ...translationFields);
      schema.relations.push(...relations);

      log.item('created', name);
    }

    // Add described enum collections
    for (const name of describedEnums) {
      if (existingCollections.has(name)) {
        log.warn(`Skipping ${name} - already exists`);
        continue;
      }

      const { collection, translationCollection, fields, translationFields, relations } =
        createDescribedEnumCollection(name, 'auxiliary', sortOrder++);

      schema.collections.push(collection, translationCollection);
      schema.fields.push(...fields, ...translationFields);
      schema.relations.push(...relations);

      log.item('created', name);
    }

    // Write updated schema to file
    const outputPath = options.schemaPath.replace('.json', '-with-auxiliary.json');
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
    log.summary('Next steps:');
    log.info('1. Run: bun run import -- -c age_ranges session_languages ...');
    log.info('2. Or use Directus Admin to verify the collections');
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log.error(`Failed to setup schema: ${msg}`);
    throw error;
  }
}
