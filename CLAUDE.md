# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ALC Stronghold Platform - <https://www.alcstronghold.com>

Monorepo for a non-profit youth organization focused on alternative leisure activities (board games, live-action roleplay, tabletop RPGs, collectible card games).

## Tech Stack

- **Monorepo**: Moonrepo + Proto
- **Runtime/Package Manager**: Bun
- **Backend**: Directus (Headless CMS)
- **Frontend**: Astro + Angular v21 islands (via AnalogJS)
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

| Service | URL | Description |
|---------|-----|-------------|
| Directus Admin | https://backend.alcstronghold.local | Headless CMS dashboard |
| Traefik Dashboard | http://localhost:8080 | Reverse proxy management |

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
│   ├── web/                 # Astro + Angular islands (main website)
│   └── mobile/              # Mobile app (TBD)
├── packages/                # Shared libraries
│   ├── domain/              # Business entities and use cases
│   ├── infrastructure/      # External services adapters (Directus SDK)
│   └── ui/                  # Shared UI components
├── tools/                   # Development utilities
│   └── directus-import/     # JSON import scripts for Directus
├── infrastructure/          # Infrastructure configuration
│   └── docker/              # Docker compose for local dev
├── .moon/                   # Moonrepo configuration
│   ├── workspace.yml        # Workspace settings
│   └── toolchain.yml        # Bun/TypeScript config
└── .prototools              # Proto version pinning
```

## Project Configuration

Each project in `apps/`, `packages/`, or `tools/` should have:
- `moon.yml` - Moon task definitions
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration (extends root)

## Conventions

- Code and comments in English
- Follow Angular style guide for Angular code
- Use Astro conventions for static content
- Directus collections follow snake_case naming