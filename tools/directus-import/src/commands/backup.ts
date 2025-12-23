import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createGzip } from 'node:zlib';
import { createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';

import type { DirectusConfig } from '../services/directus';
import { createClient } from '../services/directus';
import { log } from '../utils';
import { exportCommand } from './export';
import { schemaExportCommand } from './schema-export';

export interface BackupOptions {
  outputDir: string;
}

/**
 * Create a timestamped backup archive containing schema and data exports.
 */
export async function backupCommand(
  config: DirectusConfig,
  options: BackupOptions
): Promise<void> {
  const timestamp = formatTimestamp(new Date());
  const snapshotName = `snapshot-${timestamp}`;
  const tempDir = join(options.outputDir, snapshotName);
  const archivePath = join(options.outputDir, `${snapshotName}.tar.gz`);

  log.header('BACKUP');
  log.summary(`Creating snapshot: ${snapshotName}`);

  try {
    // Create temp directory
    await mkdir(tempDir, { recursive: true });

    // Export schema
    const schemaPath = join(tempDir, 'schema.json');
    await schemaExportCommand(config, { outputPath: schemaPath });

    // Export data
    const dataDir = join(tempDir, 'data');
    await mkdir(dataDir, { recursive: true });
    await exportCommand(config, { seedsDir: dataDir });

    // Create tar.gz archive
    log.info('Creating archive...');
    await createTarGz(tempDir, archivePath, snapshotName);

    // Cleanup temp directory
    await rm(tempDir, { recursive: true, force: true });

    console.log('');
    log.success(`Backup created: ${archivePath}`);
  } catch (error) {
    // Cleanup on error
    await rm(tempDir, { recursive: true, force: true }).catch(() => {});
    throw error;
  }
}

function formatTimestamp(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  return `${year}-${month}-${day}--${hours}-${minutes}`;
}

/**
 * Create a tar.gz archive from a directory.
 * Simple implementation using tar format.
 */
async function createTarGz(
  sourceDir: string,
  outputPath: string,
  baseName: string
): Promise<void> {
  const files = await collectFiles(sourceDir, '');
  const tarData = await createTarBuffer(files, baseName);

  // Compress with gzip
  const gzip = createGzip({ level: 9 });
  const output = createWriteStream(outputPath);

  await pipeline(
    Readable.from([tarData]),
    gzip,
    output
  );
}

interface TarFile {
  name: string;
  content: Buffer;
}

async function collectFiles(dir: string, prefix: string): Promise<TarFile[]> {
  const files: TarFile[] = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      const subFiles = await collectFiles(fullPath, relativePath);
      files.push(...subFiles);
    } else if (entry.isFile()) {
      const content = await readFile(fullPath);
      files.push({ name: relativePath, content });
    }
  }

  return files;
}

async function createTarBuffer(files: TarFile[], baseName: string): Promise<Buffer> {
  const blocks: Buffer[] = [];

  for (const file of files) {
    const name = `${baseName}/${file.name}`;
    const header = createTarHeader(name, file.content.length);
    blocks.push(header);
    blocks.push(file.content);

    // Pad to 512-byte boundary
    const padding = 512 - (file.content.length % 512);
    if (padding < 512) {
      blocks.push(Buffer.alloc(padding, 0));
    }
  }

  // End of archive (two 512-byte zero blocks)
  blocks.push(Buffer.alloc(1024, 0));

  return Buffer.concat(blocks);
}

function createTarHeader(name: string, size: number): Buffer {
  const header = Buffer.alloc(512, 0);

  // File name (100 bytes)
  const nameBytes = Buffer.from(name.slice(0, 100), 'utf8');
  nameBytes.copy(header, 0);

  // File mode (8 bytes) - 0644
  Buffer.from('0000644\0', 'utf8').copy(header, 100);

  // Owner UID (8 bytes)
  Buffer.from('0000000\0', 'utf8').copy(header, 108);

  // Owner GID (8 bytes)
  Buffer.from('0000000\0', 'utf8').copy(header, 116);

  // File size in octal (12 bytes)
  const sizeStr = size.toString(8).padStart(11, '0') + '\0';
  Buffer.from(sizeStr, 'utf8').copy(header, 124);

  // Modification time (12 bytes)
  const mtime = Math.floor(Date.now() / 1000).toString(8).padStart(11, '0') + '\0';
  Buffer.from(mtime, 'utf8').copy(header, 136);

  // Checksum placeholder (8 bytes of spaces)
  Buffer.from('        ', 'utf8').copy(header, 148);

  // Type flag ('0' = regular file)
  header[156] = 0x30;

  // USTAR indicator
  Buffer.from('ustar\x00', 'utf8').copy(header, 257);
  Buffer.from('00', 'utf8').copy(header, 263);

  // Calculate and set checksum
  let checksum = 0;
  for (let i = 0; i < 512; i++) {
    checksum += header[i];
  }
  const checksumStr = checksum.toString(8).padStart(6, '0') + '\0 ';
  Buffer.from(checksumStr, 'utf8').copy(header, 148);

  return header;
}
