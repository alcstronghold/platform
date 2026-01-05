import { createReadStream } from 'node:fs';
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { Writable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createGunzip } from 'node:zlib';

import type { DirectusConfig } from '../types';
import { log } from '../utils';
import { importCommand } from './import';
import { schemaImportCommand } from './schema-import';

export type { RestoreOptions } from '../types';

/**
 * Restore from a timestamped backup archive.
 */
export async function restoreCommand(
  config: DirectusConfig,
  options: RestoreOptions
): Promise<void> {
  const archiveName = basename(options.archivePath, '.tar.gz');
  const tempDir = join(process.cwd(), `.restore-${Date.now()}`);

  log.header('RESTORE');
  log.summary(`Archive: ${options.archivePath}`);

  try {
    // Extract archive
    log.info('Extracting archive...');
    await mkdir(tempDir, { recursive: true });
    await extractTarGz(options.archivePath, tempDir);

    // Find the snapshot directory (should be the only directory inside)
    const entries = await readdir(tempDir, { withFileTypes: true });
    const snapshotDir = entries.find((e) => e.isDirectory());

    if (!snapshotDir) {
      throw new Error('Invalid archive: no snapshot directory found');
    }

    const snapshotPath = join(tempDir, snapshotDir.name);

    // Restore schema
    if (!options.skipSchema) {
      const schemaPath = join(snapshotPath, 'schema.json');
      try {
        await readFile(schemaPath);
        await schemaImportCommand(config, {
          inputPath: schemaPath,
          force: options.force,
        });
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          log.warn('No schema.json found in archive, skipping schema restore');
        } else {
          throw error;
        }
      }
    } else {
      log.info('Skipping schema restore (--skip-schema)');
    }

    // Restore data
    if (!options.skipData) {
      const dataDir = join(snapshotPath, 'data');
      try {
        await readdir(dataDir);
        await importCommand(config, {
          seedsDir: dataDir,
        });
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          log.warn('No data directory found in archive, skipping data restore');
        } else {
          throw error;
        }
      }
    } else {
      log.info('Skipping data restore (--skip-data)');
    }

    // Cleanup
    await rm(tempDir, { recursive: true, force: true });

    console.log('');
    log.success(`Restore completed from: ${archiveName}`);
  } catch (error) {
    // Cleanup on error
    await rm(tempDir, { recursive: true, force: true }).catch(() => {});
    throw error;
  }
}

/**
 * Extract a tar.gz archive.
 */
async function extractTarGz(archivePath: string, outputDir: string): Promise<void> {
  const chunks: Buffer[] = [];

  // Decompress gzip
  const gunzip = createGunzip();
  const collector = new Writable({
    write(chunk, _encoding, callback) {
      chunks.push(chunk);
      callback();
    },
  });

  await pipeline(createReadStream(archivePath), gunzip, collector);

  const tarData = Buffer.concat(chunks);

  // Parse tar
  await extractTar(tarData, outputDir);
}

async function extractTar(tarData: Buffer, outputDir: string): Promise<void> {
  let offset = 0;

  while (offset < tarData.length) {
    // Read header (512 bytes)
    const header = tarData.subarray(offset, offset + 512);

    // Check for end of archive (all zeros)
    if (header.every((b) => b === 0)) {
      break;
    }

    // Parse header
    const name = header.subarray(0, 100).toString('utf8').replace(/\0.*$/, '');
    const sizeStr = header.subarray(124, 136).toString('utf8').replace(/\0.*$/, '').trim();
    const size = parseInt(sizeStr, 8) || 0;
    const typeFlag = header[156];

    offset += 512;

    // Skip if not a regular file
    if (typeFlag !== 0x30 && typeFlag !== 0) {
      // Advance past content
      const blocks = Math.ceil(size / 512);
      offset += blocks * 512;
      continue;
    }

    if (name && size > 0) {
      // Read file content
      const content = tarData.subarray(offset, offset + size);

      // Create file
      const filePath = join(outputDir, name);
      const dirPath = join(filePath, '..');
      await mkdir(dirPath, { recursive: true });
      await writeFile(filePath, content);
    }

    // Advance to next header (512-byte aligned)
    const blocks = Math.ceil(size / 512);
    offset += blocks * 512;
  }
}
