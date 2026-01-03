# PLANNING.md

Tareas pendientes del proyecto. Priorizar moviendo hacia arriba.

## En Progreso

- [ ] **Sistema de Partidas (rpg_sessions)** - MVP para gestión de partidas:
  - [x] Tipos TypeScript para colecciones auxiliares (11 enums)
  - [x] Payloads y seeds para colecciones auxiliares
  - [x] Importadores genéricos (SimpleEnumImporter, DescribedEnumImporter)
  - [x] Tipos TypeScript para rpg_sessions y user_profiles
  - [x] Crear colecciones auxiliares en Directus (schema) - 23 collections, 54 items
  - [x] Crear rpg_sessions y user_profiles en Directus - 10 collections
  - [x] Activar slugify en todos los campos identifier (18 collections)
  - [x] **Configurar roles y políticas granulares**:
    - [x] Comando `roles-setup` creado con definición de roles y policies
    - [x] 3 roles: Administrator, Collaborator, Member (niveles de acceso)
    - [x] 7 policies granulares: base:content-reader, user-profiles:self, rpg-sessions:player, rpg-sessions:master, rpg-sessions:moderator, content:moderator, user-profiles:moderator
    - [x] 277 permisos totales distribuidos en policies
    - [x] Vinculación role→policy via `directus_access`
    - [x] Documentación en CLAUDE.md y README.md
  - [x] Ajustar display/interface de campos:
    - [x] identifier: display `formatted-value` con monospace + bold
    - [x] status: display `labels` con `showAsDot: true` y colores
    - [x] Comando `fields-display` creado (37 campos actualizados)
  - [ ] packages/domain con entidades y casos de uso

## En Progreso - Frontend Apps

- [ ] **Frontend Apps + Shared UI** (Tailwind + Flowbite v4.1):
  - [ ] packages/ui - Theme Tailwind compartido
  - [ ] apps/web - Astro v5 con landing dummy
  - [ ] apps/dashboard - Angular v21 con auth básico
  - [ ] Integración Directus - Login, user management

## Pendiente - Alta Prioridad

## Pendiente - Media Prioridad

- [ ] **packages/domain** - Entidades de negocio y casos de uso
- [ ] **packages/ui** - Componentes UI compartidos
- [ ] **Documentación API** - Generar docs desde tipos TypeScript

## Ideas / Backlog

- [ ] **MCP Server propio** - Exponer herramientas del monorepo via MCP
- [ ] **Sync bidireccional Directus** - Detectar cambios y sincronizar automáticamente
- [ ] **CLI interactivo** - Menús con selección de colecciones para import/export
- [ ] **Validación de datos** - Validar JSON contra schemas antes de importar
- [ ] **CI/CD con GitHub Actions** - Build, lint, test en cada PR

## Completado

- [x] **directus-schema types** - Tipos TypeScript para todas las colecciones:
  - [x] RpgFamily, RpgFamilyTranslation, RpgFamiliesSettings
  - [x] RpgSystem, RpgSystemTranslation
  - [x] RpgEdition, RpgEditionTranslation
  - [x] Setting, SettingTranslation, SettingsGenres
- [x] Configurar monorepo (Moonrepo + Proto + Bun)
- [x] Docker Compose (Traefik + PostgreSQL + Redis + Directus)
- [x] HTTPS local con mkcert
- [x] Migrar schema de Railway a Directus local
- [x] Crear estructura de packages (directus-schema, directus-payload)
- [x] Configurar TypeScript Project References
- [x] Script de versionado (scripts/version.ts)
- [x] ESLint + Prettier (ESLint para TS/JS, Prettier para JSON/YAML/MD)
- [x] **directus-import CLI** - Importadores completos con upsert, retry, M2M y FK:
  - [x] LanguageImporter (code como PK)
  - [x] GenreImporter (multi-pass para jerarquías parent_id)
  - [x] PublisherImporter
  - [x] SettingImporter (M2M con genres)
  - [x] RpgFamilyImporter (M2M con settings)
  - [x] RpgSystemImporter
  - [x] RpgEditionImporter (FK a rpg_families y rpg_systems)
- [x] **directus-payload interfaces** - Todas las interfaces para JSON seeds
- [x] **Importar datos a Directus local** - Migrados todos los seeds:
  - 2 languages, 112 genres, 60 publishers
  - 174 settings, 109 rpg_families, 68 rpg_systems, 217 rpg_editions
- [x] **dotenvx** - Encriptación de variables de entorno sensibles
- [x] **Schema management CLI** - Comandos para gestionar estructura de Directus:
  - [x] schema-export - Exportar schema a JSON
  - [x] schema-import - Importar schema con diff detection
  - [x] schema-clear - Borrar colecciones custom
- [x] **Backup & Restore CLI** - Archivos tar.gz con schema + datos:
  - [x] backup - Crear snapshot-yyyy-MM-dd--HH-mm.tar.gz
  - [x] restore - Restaurar desde archivo (--skip-schema, --skip-data, --force)
- [x] **Data exporters** - Exportar datos a JSON con formato Payload:
  - [x] LanguageExporter, GenreExporter, PublisherExporter
  - [x] SettingExporter (M2M genres), RpgFamilyExporter (M2M settings)
  - [x] RpgSystemExporter, RpgEditionExporter (FK resolution)
- [x] **Reorganización types/ en directus-import** - Estructura nested:
  - [x] types/config/ - DirectusConfig, ImporterConfig, ExporterConfig
  - [x] types/commands/ - Opciones de todos los comandos CLI
  - [x] types/schema/ - CollectionInfo, RelationInfo, DeletionPriority
  - [x] types/importers/ - ImportResult
  - [x] types/exporters/ - ExportResult + entidades (GenreEntity, etc.)
  - [x] types/common/ - TarFile
- [x] **Normalización de tipado** - Convención `prop: T | null` para JSON payloads:
  - [x] directus-payload: PublisherPayload, GenrePayload, RpgSystemPayload, RpgEditionPayload
  - [x] Exporters actualizados para incluir siempre campos nullables
- [x] **Tests unitarios directus-import** - Bun test con 284 tests:
  - [x] utils/retry.ts - isRetryableError, withRetry (25 tests)
  - [x] utils/log.ts - extractErrorMessage (21 tests)
  - [x] utils/normalize.ts - normalizeBggId, normalizeString, normalizeUrl (34 tests)
  - [x] utils/translations.ts - buildTranslationRequests, extractTranslationContent (16 tests)
  - [x] utils/relations.ts - resolución FK/M2M, mapas id↔identifier (26 tests)
  - [x] importers/genre.utils.ts - multi-pass algorithm, circular deps (20 tests)
  - [x] Refactorización: lógica pura extraída para testeo sin mocks
  - [x] Task `test` añadida a moon.yml
- [x] **Colecciones auxiliares (enums)** - 11 colecciones tipo enum:
  - [x] directus-schema: tipos e interfaces
  - [x] directus-payload: interfaces para JSON
  - [x] Seeds JSON con traducciones es-ES y ca-ES
  - [x] SimpleEnumImporter y DescribedEnumImporter genéricos
- [x] **Tipos para rpg_sessions y user_profiles** - Modelos principales:
  - [x] RpgSession con M2M (genres, accessibility, languages, warnings, safety)
  - [x] RpgSessionPlayer para inscripciones
  - [x] UserProfile con datos básicos, eventos e indicadores estadísticos
- [x] **Schema Directus para rpg_sessions** - 50 collections, 291 fields, 82 relations:
  - [x] schema-setup: Genera 11 enums + traducciones programáticamente
  - [x] schema-sessions: Genera user_profiles, rpg_sessions y tablas M2M
  - [x] Campos audit (user_created, date_created, user_updated, date_updated)
  - [x] Importación datos auxiliares (54 items en 11 colecciones)

---

_Última actualización: 2025-12-30_
