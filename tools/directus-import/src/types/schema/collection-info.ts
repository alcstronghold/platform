export interface CollectionInfo {
  collection: string;
  schema: { name: string } | null;
  meta?: { system?: boolean };
}
