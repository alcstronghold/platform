# PLANNING.md

Tareas pendientes del proyecto. Priorizar moviendo hacia arriba.

## En Progreso

- [ ] **Completar directus-schema types** - Añadir tipos para todas las colecciones:
  - [ ] RpgFamily, RpgFamilyTranslation
  - [ ] RpgSystem, RpgSystemTranslation
  - [ ] RpgEdition, RpgEditionTranslation
  - [ ] Setting, SettingTranslation
  - [ ] Junction tables (settings_genres, rpg_families_settings)

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

---

_Última actualización: 2024-12-23_
