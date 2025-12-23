# PLANNING.md

Tareas pendientes del proyecto. Priorizar moviendo hacia arriba.

## En Progreso

- [ ] **Completar directus-import CLI** - Implementar comandos de import/export con transformación Payload ↔ Directus
- [ ] **Completar directus-payload interfaces** - Añadir todas las interfaces para los JSON de seeds

## Pendiente - Alta Prioridad

- [ ] **Importar datos a Directus local** - Usar directus-import para migrar datos desde los JSON de seeds
- [ ] **Completar directus-schema types** - Añadir tipos para todas las colecciones:
  - [ ] RpgFamily, RpgFamilyTranslation
  - [ ] RpgSystem, RpgSystemTranslation
  - [ ] RpgEdition, RpgEditionTranslation
  - [ ] Setting, SettingTranslation
  - [ ] Junction tables (settings_genres, rpg_families_settings)

## Pendiente - Media Prioridad

- [ ] **Añadir tests unitarios** - Configurar Bun test para los paquetes

## Pendiente - Baja Prioridad

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

---

_Última actualización: 2024-12-23_
