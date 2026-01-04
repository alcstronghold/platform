# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ALC Stronghold Platform <https://www.alcstronghold.com>

Monorepo for a non-profit youth organization focused on alternative leisure activities (board games, live-action roleplay, tabletop RPGs, collectible card games).

## Tech Stack

- **Monorepo**: Moonrepo + Proto
- **Runtime/Package Manager**: Bun
- **Backend**: Directus (Headless CMS)
- **Frontend**: Astro v5 (public) + Angular v21 (dashboard)
- **UI**: Tailwind CSS v4 + Flowbite v4
- **Database**: PostgreSQL + Redis (via Docker)

## Commands

```bash
# Install proto toolchain (first time setup)
proto use

# Install dependencies
bun install

# Run moon tasks
moon run <project>:<task>
moon run :build              # Build all projects
moon run :lint --affected    # Lint affected projects
moon run :test               # Run all tests

# Check workspace
moon check --all
```

## Local Development Environment

### Prerequisites

- Docker Desktop (with WSL2 backend on Windows)
- mkcert (for local HTTPS certificates)

### First-time setup

```bash
# 1. Install mkcert root CA (one-time, requires admin)
mkcert -install

# 2. Generate local certificates (already done, in infrastructure/docker/certs/)
cd infrastructure/docker/certs
mkcert "*.alcstronghold.local" "alcstronghold.local" "localhost" "127.0.0.1"

# 3. Add to hosts file (requires admin)
# Windows: Add to C:\Windows\System32\drivers\etc\hosts
# Linux/Mac: Add to /etc/hosts
127.0.0.1 backend.alcstronghold.local
127.0.0.1 alcstronghold.local

# 4. Copy environment file
cd infrastructure/docker
cp .env.example .env
# Edit .env with your values (generate DIRECTUS_SECRET with: openssl rand -base64 32)
```

### Start/Stop services

```bash
cd infrastructure/docker

# Start all services
docker compose up -d

# Stop all services
docker compose down

# View logs
docker compose logs -f

# Restart specific service
docker compose restart directus
```

### Services & URLs

| Service           | URL                                 | Description              |
| ----------------- | ----------------------------------- | ------------------------ |
| Directus Admin    | https://backend.alcstronghold.local | Headless CMS dashboard   |
| Traefik Dashboard | http://localhost:8080               | Reverse proxy management |

### Docker Stack

- **Traefik v3.6** - Reverse proxy with automatic HTTPS (mkcert certificates)
- **PostgreSQL 17** - Primary database
- **Redis 7** - Cache layer
- **Directus 11** - Headless CMS / Backend API

### Default Credentials (development only)

- **Directus Admin**: Check `.env` file for `ADMIN_EMAIL` and `ADMIN_PASSWORD`

### Troubleshooting

- **Port 80/443 in use**: On Windows, run `net stop http` or reset WinNAT service
- **Certificate not trusted**: Run `mkcert -install` again as administrator
- **Docker socket issues**: Ensure Docker Desktop is running and WSL2 integration is enabled

## Architecture (Clean Architecture)

```
platform/
├── apps/                    # Deployable applications
│   ├── web/                 # Astro v5 (public website)
│   ├── dashboard/           # Angular v21 (admin panel)
│   └── mobile/              # Mobile app (TBD)
├── packages/                # Shared libraries
│   ├── directus-schema/     # TypeScript types for Directus collections
│   ├── directus-payload/    # Payload interfaces for JSON import/export
│   ├── domain/              # Business entities and use cases
│   ├── infrastructure/      # External services adapters (Directus SDK)
│   └── ui/                  # Shared Tailwind + Flowbite theme
├── tools/                   # Development utilities
│   └── directus-import/     # CLI for importing/exporting Directus data
├── infrastructure/          # Infrastructure configuration
│   ├── docker/              # Docker compose for local dev
│   ├── seeds/               # JSON seed data for Directus collections
│   ├── backups/             # Exported JSON data
│   │   └── snapshots/       # Backup archives (.tar.gz)
│   └── schema/              # Directus schema JSON
├── scripts/                 # Workspace-level scripts
│   └── version.ts           # Version bumping script
├── .moon/                   # Moonrepo configuration
│   ├── workspace.yml        # Workspace settings
│   └── toolchain.yml        # Bun/TypeScript config
└── .prototools              # Proto version pinning
```

## TypeScript Project References

The monorepo uses TypeScript project references for proper type checking and incremental builds.

### Configuration

```
tsconfig.json (root)
├── references → all projects
│
├── packages/directus-schema/tsconfig.json
│   └── composite: true (no dependencies)
│
├── packages/directus-payload/tsconfig.json
│   ├── composite: true
│   └── references → directus-schema
│
└── tools/directus-import/tsconfig.json
    ├── composite: true
    └── references → directus-schema, directus-payload
```

### Moon Toolchain Settings

```yaml
# .moon/toolchain.yml
typescript:
  routeOutDirToCache: false # Each project uses its own ./dist
  syncProjectReferences: true # Moon auto-syncs references based on dependencies
```

### Build Output

Each project generates in its `./dist` folder:

- `*.js` - Compiled JavaScript
- `*.d.ts` - Type declarations
- `*.d.ts.map` - Source maps for "Go to Definition"
- `*.tsbuildinfo` - Incremental build cache

### Package Exports

During development, packages export source TypeScript directly:

```json
{
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "import": "./src/index.ts"
    }
  }
}
```

## Directus Data Packages

### @alcstronghold/directus-schema

TypeScript types that mirror Directus collections:

- `LanguageCodes` - Supported language codes (`es-ES`, `ca-ES`)
- `Genre`, `Publisher`, `RpgFamily`, `RpgSystem`, `RpgEdition`, `Setting`
- Base types: `Status`, `TextDirection`, `BaseEntity`, `TranslatableEntity`

### @alcstronghold/directus-payload

Payload interfaces for JSON import/export files:

- `GenrePayload`, `PublisherPayload`, `SettingPayload`
- `RpgFamilyPayload`, `RpgSystemPayload`, `RpgEditionPayload`
- Uses `Record<LanguageCodes, string>` for translations

### Seed Data Location

JSON files for seeding Directus are stored in `infrastructure/seeds/`:

- `languages.json`, `genres.json`, `publishers.json`
- `rpg-families.json`, `rpg-systems.json`, `rpg-editions.json`
- `settings.json`

## Frontend Apps

### @alcstronghold/ui

Shared UI theme package with Tailwind CSS v4 + Flowbite v4:

```
packages/ui/src/styles/
├── globals.css    # Main entry: Tailwind + Flowbite theme
└── fonts.css      # InterDisplay font with OpenType features
```

Usage in apps:

```css
/* Import shared theme */
@import "@alcstronghold/ui/styles/globals.css";

/* Scan app files for Tailwind classes */
@source "./**/*.html";
@source "./**/*.ts";
```

### apps/web (Astro v5)

Public website with static content:

```bash
moon run web:dev      # Dev server at http://localhost:4321
moon run web:build    # Production build
```

- Tailwind via `@tailwindcss/vite` plugin
- MDX support for content pages
- Sitemap generation

### apps/dashboard (Angular v21)

Admin panel with user management:

```bash
moon run dashboard:dev    # Dev server at http://localhost:4200
moon run dashboard:build  # Production build
```

- Standalone components with signals
- Tailwind via `@tailwindcss/postcss`
- Flowbite components with `initFlowbite()`
- Vitest for unit testing

## Directus Import CLI

CLI tool for importing/exporting data between JSON files and Directus.

### Usage

```bash
cd tools/directus-import

# Import all collections (respects dependency order)
bun run import

# Import specific collections
bun run import -- --collections languages genres publishers

# Import with verbose output
bun run import -- --verbose
```

### Import Order (by dependency)

1. `languages` - Base collection (code as PK)
2. `genres` - Self-referential (parent_id), multi-pass import
3. `publishers` - Simple with translations
4. `settings` - M2M with genres
5. `rpg_families` - M2M with settings
6. `rpg_systems` - Simple with translations + bgg_id
7. `rpg_editions` - FK to rpg_families and rpg_systems

### Environment Variables

Uses dotenvx for encrypted environment variables:

```bash
# .env (encrypted values)
DIRECTUS_URL="https://backend.alcstronghold.local"
DIRECTUS_TOKEN="encrypted:..."
NODE_TLS_REJECT_UNAUTHORIZED="0"  # Dev only (mkcert)
```

```bash
# Encrypt/decrypt .env
bun run env:encrypt
bun run env:decrypt
```

### Features

- **Upsert pattern** - Creates new items, updates existing (by identifier)
- **Multi-pass import** - Handles hierarchical data (genres with parent_id)
- **M2M relationships** - Resolves identifiers to UUIDs (settings↔genres, families↔settings)
- **FK relationships** - Resolves foreign keys (editions→families, editions→systems)
- **Retry with backoff** - Automatic retry on connection errors
- **Colored output** - Visual feedback for created/updated/failed items

### Schema Management

Commands for managing Directus schema (structure, not data):

```bash
# Export schema to JSON
bun run schema:export
# Output: infrastructure/schema/directus-schema.json

# Import schema from JSON (with diff detection)
bun run schema:import
bun run schema:import -- --dry-run    # Preview changes
bun run schema:import -- --force      # Bypass version checks

# Clear all custom collections (DESTRUCTIVE!)
bun run schema:clear -- --dry-run     # Preview what will be deleted
bun run schema:clear -- --force       # Actually delete
```

Schema files are stored in `infrastructure/schema/`

### Data Export

Export data from Directus to JSON files:

```bash
# Export all collections to JSON
bun run export
# Output: infrastructure/backups/*.json

# Export specific collections
bun run export -- -c languages genres publishers
```

### Backup & Restore

Full backup/restore of schema and data as timestamped archives:

```bash
# Create backup (schema + all collection data)
bun run backup
# Output: infrastructure/backups/snapshots/snapshot-yyyy-MM-dd--HH-mm.tar.gz

# Restore from backup
bun run restore <path-to-archive.tar.gz>

# Restore options
bun run restore -- --skip-schema <archive>  # Only restore data
bun run restore -- --skip-data <archive>    # Only restore schema
bun run restore -- --force <archive>        # Bypass version checks
```

Backup archives are stored in `infrastructure/backups/snapshots/`

### Roles & Policies Setup

Configure Directus roles and granular policies:

```bash
# Apply roles and policies to Directus
bun run roles:setup

# Preview changes without applying
bun run roles:setup -- --dry-run
```

#### Architecture

The permission system separates **Roles** (application access levels) from **Policies** (granular permissions):

**Roles** define which applications a user can access:

| Role          | Directus Admin | Backend Dashboard | Public API |
| ------------- | -------------- | ----------------- | ---------- |
| Administrator | ✓              | ✓                 | ✓          |
| Collaborator  | ✗              | ✓                 | ✓          |
| Member        | ✗              | ✗                 | ✓          |

**Policies** define granular permissions per feature:

| Policy                    | Description                               |
| ------------------------- | ----------------------------------------- |
| `base:content-reader`     | Read public content (genres, systems...) |
| `user-profiles:self`      | Manage own user profile                   |
| `rpg-sessions:player`     | Register as player in sessions            |
| `rpg-sessions:master`     | Create and manage own RPG sessions        |
| `rpg-sessions:moderator`  | Moderate all RPG sessions                 |
| `content:moderator`       | Moderate catalog content                  |
| `user-profiles:moderator` | Moderate all user profiles                |

**Default Policy Assignments**:

- **Administrator**: Has `admin_access`, no policies needed
- **Collaborator**: `base:content-reader`
- **Member**: `base:content-reader`, `user-profiles:self`, `rpg-sessions:player`

Users can have multiple roles (e.g., admin + master). Additional policies can be assigned directly to users:

```bash
# Assign policy to user via Directus API
POST /access { "user": "<user_id>", "policy": "<policy_id>" }
```

## Version Management

```bash
bun run version        # Interactive version selector
bun run version:patch  # Bump patch (0.0.1 → 0.0.2)
bun run version:minor  # Bump minor (0.0.1 → 0.1.0)
bun run version:major  # Bump major (0.0.1 → 1.0.0)
```

Updates all `package.json` files in the monorepo. No git operations (managed separately with git-flow).

## Project Configuration

Each project in `apps/`, `packages/`, or `tools/` should have:

- `moon.yml` - Moon task definitions
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration (extends root)

## Linting & Formatting

### ESLint (TypeScript/JavaScript)

ESLint handles all TS/JS linting with strict rules:

```bash
bun run lint        # Check for issues
bun run lint:fix    # Auto-fix issues
```

Key rules:

- Single quotes enforced
- Automatic import sorting (`simple-import-sort`)
- Semicolons required
- `no-console` warning (disabled for `scripts/` and `tools/`)
- TypeScript strict rules enabled

Configuration: `eslint.config.js` (ESLint 9 flat config)

### Prettier (JSON, YAML, Markdown, HTML, CSS)

Prettier formats non-TS/JS files only:

```bash
bun run format        # Format files
bun run format:check  # Check formatting
```

TS/JS files are ignored by Prettier (`.prettierignore`) - ESLint handles those.

Configuration: `.prettierrc`

## Testing

### Bun Test

Tests use Bun's built-in test runner. Currently configured for `directus-import`:

```bash
cd tools/directus-import

bun test              # Run all tests
bun test --watch      # Watch mode
bun test <file>       # Run specific test file

# Via moon
moon run directus-import:test
```

### Test Structure

```
tools/directus-import/src/
├── utils/
│   ├── log.ts              # Logging utilities
│   ├── normalize.ts        # Data normalization (bggId, strings, URLs)
│   ├── relations.ts        # FK/M2M resolution utilities
│   ├── retry.ts            # Retry with exponential backoff
│   ├── translations.ts     # Translation request builders
│   └── __tests__/
│       ├── log.test.ts           # extractErrorMessage (21 tests)
│       ├── normalize.test.ts     # normalizeBggId, etc. (34 tests)
│       ├── relations.test.ts     # FK/M2M resolution (26 tests)
│       ├── retry.test.ts         # isRetryableError, withRetry (25 tests)
│       └── translations.test.ts  # buildTranslationRequests (16 tests)
└── importers/
    ├── genre.utils.ts      # Multi-pass import logic (pure functions)
    └── __tests__/
        └── genre.utils.test.ts   # Multi-pass, circular deps (20 tests)
```

**Total: 142 tests**

### Testing Philosophy

- **Test pure functions**: Extract logic from classes to testable pure functions
- **Test edge cases**: null, undefined, invalid inputs, circular references
- **Test real scenarios**: Use actual error formats from Directus
- **Skip trivial tests**: Don't test getters/setters or simple wrappers
- **No excessive mocking**: Prefer extracting pure logic over mocking dependencies

### Writing Tests

```typescript
import { describe, expect, it } from 'bun:test';

describe('functionName', () => {
  it('describes expected behavior', () => {
    expect(functionName(input)).toBe(expectedOutput);
  });
});
```

## Conventions

- Code and comments in English
- Follow Angular style guide for Angular code
- Use Astro conventions for static content
- Directus collections follow snake_case naming

### TypeScript Typing Conventions

For JSON payloads and API responses:

```typescript
// CORRECT: Use `| null` for nullable fields (JSON has no undefined)
interface Payload {
  required: string;
  nullable: string | null;
}

// INCORRECT: Don't mix `?:` with `| null` (redundant)
interface Payload {
  field?: string | null; // BAD: ? already implies undefined
}
```

For configuration/options objects:

```typescript
// CORRECT: Use `?:` for optional config (can be omitted)
interface Options {
  verbose?: boolean;
  timeout?: number;
}
```
