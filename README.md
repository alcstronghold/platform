# ALC Stronghold - Platform

Monorepo for [ALC Stronghold](https://www.alcstronghold.com), a non-profit youth organization focused on alternative leisure activities (board games, live-action roleplay, tabletop RPGs, collectible card games).

## Tech Stack

- **Monorepo**: Moonrepo and Proto
- **Runtime/Package Manager**: Bun
- **Backend**: Directus 11 (Headless CMS)
- **Frontend**: Astro v5 (public) and Angular v21 (dashboard, islands planned via AnalogJS)
- **UI**: Tailwind CSS v4 and Flowbite v4
- **Database**: PostgreSQL 17 and Redis 7 (via Docker)
- **Reverse Proxy**: Traefik v3.6 with mkcert HTTPS

## Development Tools

- **IDE**: WebStorm (with JetBrains MCP integration)
- **Git Client**: GitKraken (with MCP tools for git operations)

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) with WSL2 backend
- [mkcert](https://github.com/FiloSottile/mkcert) for local HTTPS certificates
- [traefik-proxy](https://github.com/pikachumetal/traefik-proxy) running (shared reverse proxy)

## Quick Start

### 1. First-time Setup

```bash
# Install mkcert root CA (one-time, requires admin)
mkcert -install

# Generate certificates for *.alcstronghold.local
# PowerShell:
.\scripts\generate-certs.ps1
# Or Bash:
./scripts/generate-certs.sh

# Configure hosts file (requires admin)
# PowerShell:
.\scripts\setup-hosts.ps1
# Or Bash:
./scripts/setup-hosts.sh

# Copy environment file
cd infrastructure/docker
cp .env.example .env
# Edit .env with your values
```

### 2. Development

```bash
# Install toolchain
proto use

# Install dependencies
bun install

# Start Docker services (requires traefik-proxy running)
cd infrastructure/docker && docker compose up -d

# Import seed data to Directus
cd tools/directus-import && bun run import

# Setup roles and policies
cd tools/directus-import && bun run roles:setup
```

### 3. Useful Commands

```bash
# Create a backup (schema and data)
cd tools/directus-import && bun run backup

# Restore from backup
cd tools/directus-import && bun run restore <archive.tar.gz>

# Export schema
cd tools/directus-import && bun run schema:export
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
│   ├── seeds/               # JSON seed data (for import)
│   ├── backups/             # Exported JSON data
│   │   └── snapshots/       # Backup archives (.tar.gz)
│   └── schema/              # Directus schema JSON
└── scripts/                 # Workspace scripts
```

## Documentation

See [CLAUDE.md](CLAUDE.md) for detailed development documentation.
