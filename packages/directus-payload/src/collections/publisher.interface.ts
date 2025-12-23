import {DefaultCollection} from '../default-collection.interface.js';

export interface PublisherPayload {
  identifier: string;
  name: string;
  website: string | null;
  logo_url: string | null;
  business_status: string;
  bgg_id: number | null;
}

export interface PublisherRequest {
  identifier: string;
  name: string;
  website: string | null;
  logo_url: string | null;
  business_status: string;
  bgg_id: number | null;
}

export interface Publisher extends DefaultCollection {
  identifier: string;
  name: string;
  website: string | null;
  logo_url: string | null;
  business_status: string;
  bgg_id: number | null;
}
