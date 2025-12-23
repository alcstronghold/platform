# ALC Stronghold - Platform

Monorepo for [ALC Stronghold](https://www.alcstronghold.com), a non-profit youth organization focused on alternative leisure activities (board games, live-action roleplay, tabletop RPGs, collectible card games).

## Tech Stack

- **Monorepo**: Moonrepo + Proto
- **Runtime/Package Manager**: Bun
- **Backend**: Directus 11 (Headless CMS)
- **Frontend**: Astro + Angular v21 islands (via AnalogJS)
- **Database**: PostgreSQL 17 + Redis 7 (via Docker)
- **Reverse Proxy**: Traefik v3.6 with mkcert HTTPS

## Quick Start

```bash
# Install toolchain
proto use

# Install dependencies
bun install

# Start Docker services
cd infrastructure/docker && docker compose up -d

# Import seed data to Directus
cd tools/directus-import && bun run import

# Create a backup (schema + data)
cd tools/directus-import && bun run backup
```

## Project Structure

```
platform/
├── apps/                    # Deployable applications
├── packages/                # Shared libraries
│   ├── directus-schema/     # TypeScript types for Directus
│   └── directus-payload/    # Payload interfaces for JSON seeds
├── tools/
│   └── directus-import/     # CLI for Directus data import/export
├── infrastructure/
│   ├── docker/              # Docker Compose (Traefik, PostgreSQL, Redis, Directus)
│   └── seeds/               # JSON seed data
└── scripts/                 # Workspace scripts
```

## Documentation

See [CLAUDE.md](./CLAUDE.md) for detailed development documentation.
