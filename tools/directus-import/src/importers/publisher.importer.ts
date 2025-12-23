import type { PublisherPayload } from '@alcstronghold/directus-payload';

import type { ImporterConfig } from './base.importer';
import { BaseImporter } from './base.importer';

/**
 * Publisher entity in Directus
 */
interface Publisher {
  id: string;
  identifier: string;
  name: string;
  website: string | null;
  logo_url: string | null;
  business_status: string;
  bgg_id: number | null;
}

/**
 * Publisher importer.
 * Publishers don't have translations - just direct field mapping.
 */
export class PublisherImporter extends BaseImporter<PublisherPayload, Publisher> {
  readonly collectionName = 'publishers';
  readonly identifierField = 'identifier' as const;

  constructor(config: ImporterConfig) {
    super(config);
  }

  protected toDirectusRequest(payload: PublisherPayload): Record<string, unknown> {
    return {
      identifier: payload.identifier,
      name: payload.name,
      website: payload.website,
      logo_url: payload.logo_url,
      business_status: payload.business_status,
      bgg_id: payload.bgg_id,
    };
  }
}
