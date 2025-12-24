export interface DiffChange {
  collection?: string;
  field?: string;
  type?: string;
}

export interface SchemaDiffResult {
  hash: string;
  diff: {
    collections?: DiffChange[];
    fields?: DiffChange[];
    relations?: DiffChange[];
  };
}
