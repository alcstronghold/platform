import { defineConfig } from 'bumpp';

export default defineConfig({
  // All package.json files at once
  all: true,
  recursive: true,

  // No git operations
  commit: false,
  tag: false,
  push: false,
});
