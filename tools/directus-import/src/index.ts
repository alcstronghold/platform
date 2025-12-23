import { resolve } from 'node:path';

import { Command } from 'commander';

import { exportCommand } from './commands/export';
import { importCommand } from './commands/import';

const program = new Command();

const DEFAULT_SEEDS_DIR = resolve(process.cwd(), 'infrastructure/seeds');

program
  .name('directus-import')
  .description('Import/Export data between JSON files and Directus')
  .version('0.1.0');

program
  .command('import')
  .description('Import data from JSON files to Directus')
  .requiredOption('-u, --url <url>', 'Directus URL')
  .option('-t, --token <token>', 'Directus static token')
  .option('-e, --email <email>', 'Directus admin email')
  .option('-p, --password <password>', 'Directus admin password')
  .option('-d, --seeds-dir <dir>', 'Seeds directory', DEFAULT_SEEDS_DIR)
  .option('-c, --collections <collections...>', 'Specific collections to import')
  .action(async (options) => {
    await importCommand(
      {
        url: options.url,
        token: options.token,
        email: options.email,
        password: options.password,
      },
      {
        seedsDir: options.seedsDir,
        collections: options.collections,
      }
    );
  });

program
  .command('export')
  .description('Export data from Directus to JSON files')
  .requiredOption('-u, --url <url>', 'Directus URL')
  .option('-t, --token <token>', 'Directus static token')
  .option('-e, --email <email>', 'Directus admin email')
  .option('-p, --password <password>', 'Directus admin password')
  .option('-d, --seeds-dir <dir>', 'Seeds directory', DEFAULT_SEEDS_DIR)
  .option('-c, --collections <collections...>', 'Specific collections to export')
  .action(async (options) => {
    await exportCommand(
      {
        url: options.url,
        token: options.token,
        email: options.email,
        password: options.password,
      },
      {
        seedsDir: options.seedsDir,
        collections: options.collections,
      }
    );
  });

program.parse();
