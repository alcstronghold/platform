import type { PublisherPayload } from '@alcstronghold/directus-payload';
import { readItems } from '@directus/sdk';

import { extractErrorMessage, log } from '../utils';
import type { ExporterConfig, ExportResult } from './base.exporter';

interface PublisherEntity {
  identifier: string;
  name: string;
  website: string | null;
  logo_url: string | null;
  business_status: string;
  bgg_id: number | null;
}

export class PublisherExporter {
  private readonly config: ExporterConfig;
  readonly collectionName = 'publishers';

  constructor(config: ExporterConfig) {
    this.config = config;
  }

  async export(): Promise<{ data: PublisherPayload[]; result: ExportResult }> {
    log.header(`Exporting ${this.collectionName}`);

    const result: ExportResult = {
      collection: this.collectionName,
      total: 0,
      errors: [],
    };

    try {
      const entities = await this.config.client.request<PublisherEntity[]>(
        readItems('publishers' as never, {
          limit: -1,
          fields: ['identifier', 'name', 'website', 'logo_url', 'business_status', 'bgg_id'] as never,
          sort: ['identifier'] as never,
        })
      );

      const data: PublisherPayload[] = entities.map((entity) => ({
        identifier: entity.identifier,
        name: entity.name,
        website: entity.website,
        logo_url: entity.logo_url,
        business_status: entity.business_status,
        bgg_id: entity.bgg_id,
      }));

      result.total = data.length;
      log.success(`Exported ${data.length} publishers`);

      return { data, result };
    } catch (error) {
      const msg = extractErrorMessage(error);
      result.errors.push(msg);
      log.error(`Failed to export publishers: ${msg}`);
      return { data: [], result };
    }
  }
}
