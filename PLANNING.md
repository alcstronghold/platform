# PLANNING.md

Tareas pendientes del proyecto. Priorizar moviendo hacia arriba.

## En Progreso

(ninguna tarea en progreso)

## Pendiente - Alta Prioridad

- [ ] **Añadir tests unitarios** - Configurar Bun test para los paquetes

## Pendiente - Media Prioridad

- [ ] **apps/web** - Configurar Astro + Angular islands (AnalogJS)
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

---

_Última actualización: 2025-12-24_
