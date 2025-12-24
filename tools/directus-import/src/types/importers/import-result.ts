export interface ImportResult {
  collection: string;
  total: number;
  created: number;
  updated: number;
  failed: number;
  errors: Array<{ identifier: string; error: string }>;
}
