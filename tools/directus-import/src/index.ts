import { resolve } from 'node:path';

import { Command } from 'commander';

import { backupCommand } from './commands/backup';
import { exportCommand } from './commands/export';
import { importCommand } from './commands/import';
import { restoreCommand } from './commands/restore';
import { schemaClearCommand } from './commands/schema-clear';
import { schemaExportCommand } from './commands/schema-export';
import { schemaImportCommand } from './commands/schema-import';
import { log } from './utils';

const program = new Command();

// Resolve relative to the project root (3 levels up from src/index.ts)
const PROJECT_ROOT = resolve(import.meta.dirname, '../../..');
const DEFAULT_SEEDS_DIR = resolve(PROJECT_ROOT, 'infrastructure/seeds');
const DEFAULT_EXPORT_DIR = resolve(PROJECT_ROOT, 'infrastructure/backups');
const DEFAULT_SCHEMA_PATH = resolve(PROJECT_ROOT, 'infrastructure/schema/directus-schema.json');
const DEFAULT_BACKUP_DIR = resolve(PROJECT_ROOT, 'infrastructure/backups/snapshots');

/**
 * Get Directus config from CLI options or environment variables
 */
function getDirectusConfig(options: {
  url?: string;
  token?: string;
  email?: string;
  password?: string;
}) {
  const url = options.url || process.env.DIRECTUS_URL;
  const token = options.token || process.env.DIRECTUS_TOKEN;
  const email = options.email || process.env.DIRECTUS_EMAIL;
  const password = options.password || process.env.DIRECTUS_PASSWORD;

  if (!url) {
    log.error('Directus URL is required. Use -u or set DIRECTUS_URL in .env');
    process.exit(1);
  }

  if (!token && !email) {
    log.error('Authentication required. Use -t/DIRECTUS_TOKEN or -e/-p/DIRECTUS_EMAIL/DIRECTUS_PASSWORD');
    process.exit(1);
  }

  return { url, token, email, password };
}

program
  .name('directus-import')
  .description('Import/Export data between JSON files and Directus')
  .version('0.1.0');

program
  .command('import')
  .description('Import data from JSON files to Directus')
  .option('-u, --url <url>', 'Directus URL (or DIRECTUS_URL env)')
  .option('-t, --token <token>', 'Directus static token (or DIRECTUS_TOKEN env)')
  .option('-e, --email <email>', 'Directus admin email (or DIRECTUS_EMAIL env)')
  .option('-p, --password <password>', 'Directus admin password (or DIRECTUS_PASSWORD env)')
  .option('-d, --seeds-dir <dir>', 'Seeds directory', DEFAULT_SEEDS_DIR)
  .option('-c, --collections <collections...>', 'Specific collections to import')
  .option('-v, --verbose', 'Show verbose output')
  .action(async (options) => {
    const config = getDirectusConfig(options);
    await importCommand(config, {
      seedsDir: options.seedsDir,
      collections: options.collections,
      verbose: options.verbose,
    });
  });

program
  .command('export')
  .description('Export data from Directus to JSON files')
  .option('-u, --url <url>', 'Directus URL (or DIRECTUS_URL env)')
  .option('-t, --token <token>', 'Directus static token (or DIRECTUS_TOKEN env)')
  .option('-e, --email <email>', 'Directus admin email (or DIRECTUS_EMAIL env)')
  .option('-p, --password <password>', 'Directus admin password (or DIRECTUS_PASSWORD env)')
  .option('-o, --output-dir <dir>', 'Output directory for exported JSON', DEFAULT_EXPORT_DIR)
  .option('-c, --collections <collections...>', 'Specific collections to export')
  .action(async (options) => {
    const config = getDirectusConfig(options);
    await exportCommand(config, {
      seedsDir: options.outputDir,
      collections: options.collections,
    });
  });

// Schema commands
program
  .command('schema-export')
  .description('Export Directus schema (collections, fields, relations) to JSON')
  .option('-u, --url <url>', 'Directus URL (or DIRECTUS_URL env)')
  .option('-t, --token <token>', 'Directus static token (or DIRECTUS_TOKEN env)')
  .option('-e, --email <email>', 'Directus admin email (or DIRECTUS_EMAIL env)')
  .option('-p, --password <password>', 'Directus admin password (or DIRECTUS_PASSWORD env)')
  .option('-o, --output <path>', 'Output file path', DEFAULT_SCHEMA_PATH)
  .action(async (options) => {
    const config = getDirectusConfig(options);
    await schemaExportCommand(config, {
      outputPath: options.output,
    });
  });

program
  .command('schema-import')
  .description('Import Directus schema from JSON file')
  .option('-u, --url <url>', 'Directus URL (or DIRECTUS_URL env)')
  .option('-t, --token <token>', 'Directus static token (or DIRECTUS_TOKEN env)')
  .option('-e, --email <email>', 'Directus admin email (or DIRECTUS_EMAIL env)')
  .option('-p, --password <password>', 'Directus admin password (or DIRECTUS_PASSWORD env)')
  .option('-i, --input <path>', 'Input file path', DEFAULT_SCHEMA_PATH)
  .option('-f, --force', 'Bypass version and vendor checks')
  .option('--dry-run', 'Show changes without applying')
  .action(async (options) => {
    const config = getDirectusConfig(options);
    await schemaImportCommand(config, {
      inputPath: options.input,
      force: options.force,
      dryRun: options.dryRun,
    });
  });

program
  .command('schema-clear')
  .description('Delete all custom collections from Directus (DESTRUCTIVE!)')
  .option('-u, --url <url>', 'Directus URL (or DIRECTUS_URL env)')
  .option('-t, --token <token>', 'Directus static token (or DIRECTUS_TOKEN env)')
  .option('-e, --email <email>', 'Directus admin email (or DIRECTUS_EMAIL env)')
  .option('-p, --password <password>', 'Directus admin password (or DIRECTUS_PASSWORD env)')
  .option('-f, --force', 'Confirm deletion (required)')
  .option('--dry-run', 'Show collections without deleting')
  .action(async (options) => {
    const config = getDirectusConfig(options);
    await schemaClearCommand(config, {
      force: options.force,
      dryRun: options.dryRun,
    });
  });

// Backup command
program
  .command('backup')
  .description('Create a timestamped backup archive (schema + data)')
  .option('-u, --url <url>', 'Directus URL (or DIRECTUS_URL env)')
  .option('-t, --token <token>', 'Directus static token (or DIRECTUS_TOKEN env)')
  .option('-e, --email <email>', 'Directus admin email (or DIRECTUS_EMAIL env)')
  .option('-p, --password <password>', 'Directus admin password (or DIRECTUS_PASSWORD env)')
  .option('-o, --output-dir <dir>', 'Output directory for backup', DEFAULT_BACKUP_DIR)
  .action(async (options) => {
    const config = getDirectusConfig(options);
    await backupCommand(config, {
      outputDir: options.outputDir,
    });
  });

// Restore command
program
  .command('restore')
  .description('Restore from a backup archive (.tar.gz)')
  .argument('<archive>', 'Path to the backup archive')
  .option('-u, --url <url>', 'Directus URL (or DIRECTUS_URL env)')
  .option('-t, --token <token>', 'Directus static token (or DIRECTUS_TOKEN env)')
  .option('-e, --email <email>', 'Directus admin email (or DIRECTUS_EMAIL env)')
  .option('-p, --password <password>', 'Directus admin password (or DIRECTUS_PASSWORD env)')
  .option('-f, --force', 'Force schema import (bypass version checks)')
  .option('--skip-schema', 'Skip schema restore')
  .option('--skip-data', 'Skip data restore')
  .action(async (archive, options) => {
    const config = getDirectusConfig(options);
    await restoreCommand(config, {
      archivePath: archive,
      force: options.force,
      skipSchema: options.skipSchema,
      skipData: options.skipData,
    });
  });

program.parse();
