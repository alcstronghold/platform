# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Entorno de Desarrollo

**CRÍTICO:** El desarrollo se realiza en **Windows con PowerShell Core**.

Ver `~/.claude/CLAUDE.md` para la guía completa sobre:

- Herramientas especializadas de Claude Code (Grep, Read, Glob)
- Uso correcto de Bash tool con pwsh
- Comandos PowerShell y Windows

## User Settings

- **Code language**: English
- **Comments language**: Spanish (technical terms in English)
- **Interaction language**: Spanish

### Formatting Preferences

- **Lists**: Use natural conjunctions instead of symbols
  - Spanish: `item1, item2 y item3` (not `item1 + item2 + item3`)
  - English: `item1, item2 and item3`
  - Alternatives: `item1, item2 or item3` (not `item1 - item2 - item3`)
- **Bold labels**: Use colon: `**Tema**: descripción` (not `**tema** - descripción`)
- **Avoid**: Spaces inside bold markers (`** text **`)

## Mensajes de Commit

**Formato:** Palabras técnicas en inglés, explicación en castellano.

```bash
✅ CORRECTO:
refactor(frontend): eliminar allowSignalWrites deprecated de los effects

Se elimina la opción allowSignalWrites de todos los effect() porque está
deprecated en Angular v21 y ya no es necesaria.

❌ INCORRECTO (todo en inglés):
refactor(frontend): remove deprecated allowSignalWrites from effects

Remove allowSignalWrites option from all effect() calls as it is deprecated
in Angular v21 and is no longer needed.
```

**Reglas:**

- Tipo de commit en inglés: `feat`, `fix`, `refactor`, `chore`, `docs`, etc.
- Scope en inglés cuando sea técnico: `frontend`, `backend`, `api`, etc.
- Título: mezcla natural (técnico en inglés, verbos/acciones en castellano)
- Cuerpo: explicación completa en castellano, manteniendo términos técnicos en inglés
- Términos técnicos siempre en inglés: `signal`, `effect`, `component`, `service`, `endpoint`, etc.

## Development Tools

### IDE: WebStorm

The project uses WebStorm with JetBrains MCP integration for:

- File problems detection (`mcp__jetbrains__get_file_problems`)
- Code navigation and search
- Terminal command execution
- Refactoring operations

## Metodología de Desarrollo

### Test-Driven Development (TDD)

**OBLIGATORIO**: Claude Code DEBE seguir TDD para TODO el código nuevo.

#### Ciclo Red-Green-Refactor

**Red (Rojo)**:

1. Escribir tests que describan el comportamiento deseado
2. Ejecutar tests - deben FALLAR (no existe implementación aún)
3. Verificar que fallan por la razón correcta

**Green (Verde)**:

1. Escribir el código MÍNIMO necesario para que los tests pasen
2. No optimizar ni sobre-diseñar
3. Ejecutar tests - deben PASAR

**Refactor**:

1. Limpiar código manteniendo tests verdes
2. Aplicar Clean Code, SOLID, eliminar code smells
3. Ejecutar tests después de cada cambio - deben permanecer verdes

#### Reglas de TDD

1. **NO escribir código de producción** sin un test que falle primero
2. **NO escribir más test** del necesario para fallar (compilación fallida cuenta)
3. **NO escribir más código** del necesario para pasar el test actual
4. **Tests primero, SIEMPRE**: Excepciones solo para:
   - HTML/CSS puro (no lógica)
   - Configuración de build tools
   - Scripts de deployment

#### Estructura de Tests

**Angular (Dashboard)**:

- Framework: Vitest (configurado en el proyecto)
- Ubicación: `*.spec.ts` junto al archivo de código
- Naming: `<component-name>.component.spec.ts`, `<service-name>.service.spec.ts`

**Astro (Web - Angular Islands)**:

- Framework: Vitest
- Ubicación: `*.spec.ts` junto al componente

**Convenciones**:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('ComponentName o FunctionName', () => {
  describe('feature o method name', () => {
    it('should describe expected behavior in specific scenario', () => {
      // Arrange (preparar)
      const input = setupInput();

      // Act (ejecutar)
      const result = functionUnderTest(input);

      // Assert (verificar)
      expect(result).toBe(expected);
    });
  });
});
```

#### Coverage Mínimo

- **Statements**: 80% mínimo
- **Branches**: 75% mínimo
- **Functions**: 80% mínimo
- **Lines**: 80% mínimo

**IMPORTANTE**: Coverage NO es el objetivo, sino un indicador. Tests deben probar comportamiento, no líneas.

#### Qué Testear (Prioridad)

**ALTA**:

- Business logic (use cases, services)
- Validaciones y transformaciones de datos
- Conditional logic y edge cases
- Error handling

**MEDIA**:

- Componentes con lógica (computed signals, form validation)
- Guards y interceptors
- Utilities y helpers

**BAJA (o Skip)**:

- Componentes puramente de presentación (solo témplate)
- Getters/setters triviales
- Configuración de DI

#### Testing Utilities

**Angular Testing**:

```typescript
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';

// Mock signals
const mockUser = signal<User | null>(null);

// Mock services con Vitest
const mockAuthService = {
  user: mockUser,
  login: vi.fn(),
  logout: vi.fn(),
};
```

**DOM Testing (opcional, para componentes complejos)**:

```typescript
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

// Preferir testing-library para tests de integración de componentes
```

#### Ejemplo Completo TDD

**Red - Test que falla**:

```typescript
describe('AuthService', () => {
  it('should return false when login fails with invalid credentials', async () => {
    const service = new AuthService(mockAuthPort);
    const result = await service.login('invalid@email.com', 'wrong');
    expect(result).toBe(false);
  });
});
```

**Green - Implementación mínima**:

```typescript
async login(email: string, password: string): Promise<boolean> {
  const result = await this.loginUseCase.execute({ email, password });
  return result.success;
}
```

**Refactor - Mejorar sin romper tests**:

```typescript
async login(email: string, password: string): Promise<boolean> {
  this.setState({ ...this.state(), isLoading: true, error: null });
  const result = await this.loginUseCase.execute({ email, password });

  if (result.success && result.user) {
    this.setState({ user: result.user, isLoading: false, error: null });
    return true;
  }

  this.setState({
    user: null,
    isLoading: false,
    error: result.error || 'Error de autenticación',
  });
  return false;
}
```

#### Comandos

```bash
# Ejecutar todos los tests
moon run :test

# Ejecutar tests de un proyecto específico
moon run dashboard:test
moon run web:test

# Watch mode (re-ejecutar al guardar)
moon run dashboard:test -- --watch

# Coverage report
moon run dashboard:test -- --coverage
```

#### Checklist Pre-Commit

Antes de hacer commit, verificar:

- [ ] Todos los tests pasan (`moon run :test`)
- [ ] Coverage mínimo alcanzado
- [ ] No hay tests skipped sin justificación (`it.skip`)
- [ ] No hay console.log en tests
- [ ] Nombres de tests son descriptivos

## Project Overview

ALC Stronghold Platform <https://www.alcstronghold.com>

Monorepo for a non-profit youth organization focused on alternative leisure activities (board games, live-action roleplay, tabletop RPGs, collectible card games).

## Tech Stack

- **Monorepo**: Moonrepo and Proto
- **Runtime/Package Manager**: Bun
- **Backend**: Directus (Headless CMS)
- **Frontend**: Astro v5 (public) and Angular v21 (dashboard)
- **UI**: Tailwind CSS v4 and Flowbite v4
- **Database**: PostgreSQL and Redis (via Docker)

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
|-------------------|-------------------------------------|--------------------------|
| Directus Admin    | https://backend.alcstronghold.local | Headless CMS dashboard   |
| Traefik Dashboard | http://localhost:8080               | Reverse proxy management |

### Docker Stack

- **Traefik v3.6**: Reverse proxy with automatic HTTPS (mkcert certificates)
- **PostgreSQL 17**: Primary database
- **Redis 7**: Cache layer
- **Directus 11**: Headless CMS / Backend API

### Default Credentials (development only)

- **Directus Admin**: Check `.env` file for `ADMIN_EMAIL` and `ADMIN_PASSWORD`

### Troubleshooting

- **Port 80/443 in use**: On Windows, run `net stop http` or reset WinNAT service
- **Certificate is not trusted**: Run `mkcert -install` again as administrator
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
│   ├── directus-client/     # Directus SDK client for authentication
│   ├── domain/              # Business entities and use cases
│   └── ui/                  # Shared Tailwind and Flowbite theme
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

## Domain Layer

### @alcstronghold/domain

Business logic layer following Clean Architecture principles. Contains entities, ports (interfaces), and use cases.

```
packages/domain/src/
├── entities/
│   └── user.entity.ts      # User, AuthenticatedUser, computeDisplayName
├── ports/
│   └── auth.port.ts        # AuthPort interface, LoginCredentials, AuthResult
├── use-cases/auth/
│   ├── login.use-case.ts   # LoginUseCase with email validation
│   ├── logout.use-case.ts  # LogoutUseCase
│   └── get-current-user.use-case.ts
└── index.ts
```

**Key interfaces**:

```typescript
// User entity
interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatar: string | null;
}

interface AuthenticatedUser extends User {
  displayName: string; // Computed: "FirstName LastName" or email prefix
}

// Auth port (interface for adapters)
interface AuthPort {
  login(credentials: LoginCredentials): Promise<AuthResult>;
  logout(): Promise<void>;
  refreshToken(): Promise<AuthResult>;
  getCurrentUser(): Promise<AuthenticatedUser | null>;
}
```

**Security note**: Email validation uses string methods (no regex) to prevent ReDoS vulnerabilities.

### @alcstronghold/directus-client

Directus SDK client implementing domain ports. Uses session-based authentication with HTTP-only cookies for security.

```
packages/directus-client/src/
├── client.ts         # createBrowserClient, createServerClient factories
├── auth.adapter.ts   # DirectusAuthAdapter implements AuthPort
└── index.ts
```

**Client factories**:

- `createBrowserClient(config)`: For client-side use, includes `credentials: 'include'`
- `createServerClient(config, headers)`: For SSR, forwards cookies from request headers

**Usage**:

```typescript
import { createBrowserClient, DirectusAuthAdapter } from '@alcstronghold/directus-client';
import { LoginUseCase } from '@alcstronghold/domain';

// Create client and adapter
const client = createBrowserClient({ url: 'https://backend.alcstronghold.local' });
const authAdapter = new DirectusAuthAdapter(client);

// Use domain use case
const loginUseCase = new LoginUseCase(authAdapter);
const result = await loginUseCase.execute({ email, password });
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

Shared UI theme package with Tailwind CSS v4 and Flowbite v4:

```
packages/ui/src/styles/
├── globals.css    # Main entry: Tailwind and Flowbite theme
└── fonts.css      # InterDisplay font with OpenType features
```

Usage in apps:

```css
/* Import shared theme */
@import '@alcstronghold/ui/styles/globals.css';

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
- Angular Islands via `@analogjs/astro-angular`

#### Angular Islands

Interactive Angular components embedded in Astro pages using partial hydration.

**Configuration files**:

- `astro.config.mjs`: Integration `angular()` from `@analogjs/astro-angular`
- `tsconfig.app.json`: Angular compiler options (per AnalogJS docs)
- `angular.json`: Minimal config for Angular Language Service in IDE

**Creating components**:

```typescript
// src/components/counter.component.ts
import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-counter',
  templateUrl: './counter.component.html',
})
export class CounterComponent {
  readonly count = signal(0);

  increment() {
    this.count.update((c) => c + 1);
  }
}
```

**Using in Astro pages**:

```astro
---
import { CounterComponent } from '../components/counter.component';
---

<CounterComponent client:visible />
```

**Hydration directives**:

| Directive        | Description                            |
|------------------|----------------------------------------|
| `client:load`    | Hydrate immediately on page load       |
| `client:visible` | Hydrate when visible (recommended)     |
| `client:idle`    | Hydrate when browser is idle           |
| (none)           | SSR only, no client-side interactivity |

**Requirements**:

- Only **standalone components** (Angular 14.2+)
- Use signals for reactive state
- Prefer `[class.X]` bindings over `NgClass` for IDE compatibility

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
- **Known warning**: "Empty sub-selector" from esbuild/critters CSS optimizer (Flowbite-related, safe to ignore)

#### Angular Signal Forms API

**CRÍTICO**: Esta es la API correcta para trabajar con `SignalFormDescriptor` y Angular Signal Forms. NO desviarse de estas convenciones.

**Actualizar valores en formularios**:

```typescript
// ✅ CORRECTO - Actualizar UN SOLO campo:
descriptor.form.email().value.set('test@example.com');
descriptor.form.password().value.set('mypassword');

// ✅ CORRECTO - Actualizar MÚLTIPLES campos (objeto):
descriptor.updateModel({ email: 'test@example.com', password: 'mypassword' });

// ❌ INCORRECTO - NO usar .set() directamente en el field:
descriptor.form.email.set('test@example.com'); // ERROR
descriptor.form.email().set('test@example.com'); // ERROR
```

**Binding en templates HTML**:

```html
<!-- ✅ CORRECTO - FormField directive SIN paréntesis: -->
<input [formField]="descriptor.form.email" />

<!-- ❌ INCORRECTO - NO añadir paréntesis al field: -->
<input [formField]="descriptor.form.email()" />
```

**Leer valores del formulario**:

```typescript
// ✅ CORRECTO - Leer valor individual:
// noinspection JSAnnotator

const email = descriptor.model().email;

// ✅ CORRECTO - Leer objeto completo:
const formData = descriptor.model();

// ❌ INCORRECTO - NO usar form field para lectura:
const email = descriptor.form.email(); // Devuelve el field object, no el valor
```

**Acceder a errores de validación**:

```typescript
// ✅ CORRECTO - Obtener errores de un campo:
const emailField = descriptor.form.email();
const errors = emailField.errors();
const firstError = errors.length > 0 ? errors[0].message : null;

// ✅ CORRECTO - Verificar si un campo fue touched:
const touched = emailField.touched();

// ✅ CORRECTO - Marcar campo como touched:
emailField.markAsTouched();
```

**Testing con Vitest**:

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>; // ✅ NUNCA usar any

  beforeEach(() => {
    TestBed.configureTestingModule({});
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should update form field value', () => {
    // ✅ CORRECTO - Actualizar un campo:
    component.descriptor.form.email().value.set('test@example.com');

    expect(component.descriptor.model().email).toBe('test@example.com');
  });

  it('should update multiple fields', () => {
    // ✅ CORRECTO - Actualizar varios campos:
    component.descriptor.updateModel({
      email: 'test@example.com',
      password: 'password123'
    });

    expect(component.descriptor.model().email).toBe('test@example.com');
    expect(component.descriptor.model().password).toBe('password123');
  });

  it('should test InputSignal', () => {
    // ✅ CORRECTO - Cambiar InputSignal en test:
    fixture.componentRef.setInput('redirectUrl', '/dashboard');

    expect(component.redirectUrl()).toBe('/dashboard');

    // ❌ INCORRECTO - NO usar .set() en InputSignal:
    // component.redirectUrl.set('/dashboard'); // ERROR
  });
});
```

**Reglas de oro**:

1. **Para actualizar UN campo**: `descriptor.form.campo().value.set(valor)` - GRÁBATELO A FUEGO
2. **Para actualizar MÚLTIPLES campos**: `descriptor.updateModel({ campo1, campo2 })`
3. **Binding en template**: `[formField]="descriptor.form.campo"` (SIN paréntesis)
4. **NUNCA usar `any`**: Siempre tipos específicos como `ComponentFixture<T>`
5. **InputSignals en tests**: `fixture.componentRef.setInput('name', value)`

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
6. `rpg_systems` - Simple with translations and bgg_id
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

- **Upsert pattern**: Creates new items, updates existing (by identifier)
- **Multi-pass import**: Handles hierarchical data (genres with parent_id)
- **M2M relationships**: Resolves identifiers to UUIDs (settings↔genres, families↔settings)
- **FK relationships**: Resolves foreign keys (editions→families, editions→systems)
- **Retry with backoff**: Automatic retry on connection errors
- **Colored output**: Visual feedback for created/updated/failed items

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
# Create backup (schema and all collection data)
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
|---------------|----------------|-------------------|------------|
| Administrator | ✓              | ✓                 | ✓          |
| Collaborator  | ✗              | ✓                 | ✓          |
| Member        | ✗              | ✗                 | ✓          |

**Policies** define granular permissions per feature:

| Policy                    | Description                              |
|---------------------------|------------------------------------------|
| `base:content-reader`     | Read public content (genres, systems...) |
| `user-profiles:self`      | Manage own user profile                  |
| `rpg-sessions:player`     | Register as player in sessions           |
| `rpg-sessions:master`     | Create and manage own RPG sessions       |
| `rpg-sessions:moderator`  | Moderate all RPG sessions                |
| `content:moderator`       | Moderate catalog content                 |
| `user-profiles:moderator` | Moderate all user profiles               |

**Default Policy Assignments**:

- **Administrator**: Has `admin_access`, no policies needed
- **Collaborator**: `base:content-reader`
- **Member**: `base:content-reader`, `user-profiles:self`, `rpg-sessions:player`

Users can have multiple roles (e.g., admin and master). Additional policies can be assigned directly to users:

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

Framework-specific configs:

- **Angular** (`apps/dashboard/**/*.ts`): `angular-eslint` with component/directive selectors
- **Angular templates** (`apps/dashboard/**/*.html`): Accessibility rules enabled
- **Astro** (`apps/web/**/*.astro`): `eslint-plugin-astro` with TypeScript parser

Configuration: `eslint.config.js` (ESLint 9 flat config)

### Prettier (JSON, YAML, Markdown, HTML, CSS, Astro)

Prettier formats non-TS/JS files only:

```bash
bun run format        # Format files
bun run format:check  # Check formatting
```

TS/JS files are ignored by Prettier (`.prettierignore`) - ESLint handles those.

Plugins:

- `prettier-plugin-astro` - Formats `.astro` files

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

- Code in English, comments in Spanish (technical terms in English)
- Follow Angular style guide for Angular code
- Use Astro conventions for static content
- Directus collections follow snake_case naming
- Use `moon run` commands instead of direct `bun` or `cd && bun` chains

### Code Smells to Avoid

Reference: [Refactoring Guru - Code Smells](https://refactoring.guru/refactoring/smells)

#### Bloaters

Code that has grown too large to work with effectively:

- **Long Method**: Methods should be short and focused
- **Large Class**: Classes with too many responsibilities
- **Primitive Obsession**: Use domain objects instead of primitives
- **Long Parameter List**: Use parameter objects or builder pattern
- **Data Clumps**: Group related data into objects

#### Object-Orientation Abusers

Incorrect application of OOP principles:

- **Alternative Classes with Different Interfaces**: Unify interfaces
- **Refused Bequest**: Don't inherit if you don't use parent behavior
- **Switch Statements**: Replace with polymorphism
- **Temporary Field**: Fields should always be meaningful

#### Change Preventers

Code that makes changes expensive:

- **Divergent Change**: One class changed for multiple reasons
- **Parallel Inheritance Hierarchies**: Adding subclass requires adding another
- **Shotgun Surgery**: One change requires many small changes

#### Dispensables

Unnecessary code that adds complexity:

- **Comments**: Code should be self-documenting
- **Duplicate Code**: Extract to shared utilities
- **Data Class**: Classes should have behavior, not just data
- **Dead Code**: Remove unused code
- **Lazy Class**: Classes must justify their existence
- **Speculative Generality**: Don't design for hypothetical futures

#### Couplers

Excessive coupling between classes:

- **Feature Envy**: Methods using other class's data extensively
- **Inappropriate Intimacy**: Classes knowing too much about each other
- **Incomplete Library Class**: Extend libraries properly
- **Message Chains**: Long chains of method calls
- **Middle Man**: Delegates without adding value

#### Project-Specific

- **Negated conditions in ternaries**: Extract to named boolean variables

```typescript
// BAD: Negated condition
existingId != null ? { id: existingId } : {};

// GOOD: Named boolean variable
const hasExistingId = existingId != null;
hasExistingId ? { id: existingId } : {};
```

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
