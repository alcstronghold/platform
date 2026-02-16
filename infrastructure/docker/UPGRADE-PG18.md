# Upgrade PostgreSQL 17 → 18

Este documento describe el proceso de actualización de PostgreSQL 17 a PostgreSQL 18 en Docker.

## Cambios importantes en PostgreSQL 18

PostgreSQL 18 introdujo cambios en la estructura de volúmenes de Docker:

- **Versión 17 y anteriores**: Volumen en `/var/lib/postgresql/data`
- **Versión 18+**: Volumen en `/var/lib/postgresql` con PGDATA en `/var/lib/postgresql/18/docker`

## Opciones de migración

### Opción 1: Instalación nueva (recomendada para desarrollo)

Si no necesitas conservar los datos actuales:

```bash
cd infrastructure/docker

# Detener servicios
docker compose down

# Eliminar volumen antiguo
docker volume rm alc-stronghold_database_data
# O eliminar la carpeta manualmente:
# rm -rf ${COMMON_PATH}/StrongholdPlatform/volumes/database/*

# Iniciar con PostgreSQL 18
docker compose up -d
```

### Opción 2: Migración con pg_upgrade

Si necesitas conservar los datos existentes:

```bash
cd infrastructure/docker

# 1. Hacer backup de los datos actuales
docker compose exec database pg_dumpall -U directus > backup-pre-pg18.sql

# 2. Detener servicios
docker compose down

# 3. Crear estructura de carpetas para pg_upgrade
mkdir -p ${COMMON_PATH}/StrongholdPlatform/volumes/pg-upgrade/17/data
mkdir -p ${COMMON_PATH}/StrongholdPlatform/volumes/pg-upgrade/18/data

# 4. Mover datos antiguos
mv ${COMMON_PATH}/StrongholdPlatform/volumes/database/* \
   ${COMMON_PATH}/StrongholdPlatform/volumes/pg-upgrade/17/data/

# 5. Inicializar PostgreSQL 18
docker run --rm \
  -v ${COMMON_PATH}/StrongholdPlatform/volumes/pg-upgrade:/var/lib/postgresql \
  -e POSTGRES_USER=directus \
  -e POSTGRES_PASSWORD=directus \
  -e POSTGRES_DB=directus \
  postgres:18 \
  bash -c "initdb -D /var/lib/postgresql/18/data"

# 6. Ejecutar pg_upgrade
docker run --rm \
  -v ${COMMON_PATH}/StrongholdPlatform/volumes/pg-upgrade:/var/lib/postgresql \
  postgres:18 \
  bash -c "pg_upgrade \
    --old-datadir=/var/lib/postgresql/17/data \
    --new-datadir=/var/lib/postgresql/18/data \
    --old-bindir=/usr/lib/postgresql/17/bin \
    --new-bindir=/usr/lib/postgresql/18/bin \
    --link"

# 7. Mover datos migrados
mv ${COMMON_PATH}/StrongholdPlatform/volumes/pg-upgrade/18/data/* \
   ${COMMON_PATH}/StrongholdPlatform/volumes/database/

# 8. Iniciar servicios
docker compose up -d
```

### Opción 3: Restauración desde backup

Si prefieres una migración más segura:

```bash
cd infrastructure/docker

# 1. Hacer backup
docker compose exec database pg_dumpall -U directus > backup-pre-pg18.sql

# 2. Detener y limpiar
docker compose down
rm -rf ${COMMON_PATH}/StrongholdPlatform/volumes/database/*

# 3. Iniciar con PostgreSQL 18
docker compose up -d database

# 4. Esperar a que PostgreSQL esté listo
docker compose exec database pg_isready

# 5. Restaurar backup
cat backup-pre-pg18.sql | docker compose exec -T database psql -U directus

# 6. Iniciar todos los servicios
docker compose up -d
```

## Verificación post-migración

```bash
# Verificar versión de PostgreSQL
docker compose exec database psql -U directus -c "SELECT version();"

# Verificar conexión de Directus
docker compose logs directus | grep -i "database"

# Verificar que las tablas existan
docker compose exec database psql -U directus -c "\dt"
```

## Rollback (si algo sale mal)

Si encuentras problemas y necesitas volver a PostgreSQL 17:

```bash
# Detener servicios
docker compose down

# Restaurar imagen antigua en compose.yaml
# Cambiar: image: postgres:18
# Por:     image: postgres:17.2

# Restaurar volumen antiguo
# Cambiar: - ${COMMON_PATH}\StrongholdPlatform\volumes\database:/var/lib/postgresql
# Por:     - ${COMMON_PATH}\StrongholdPlatform\volumes\database:/var/lib/postgresql/data

# Iniciar servicios
docker compose up -d
```

## Referencias

- [PostgreSQL 18 Docker Hub](https://hub.docker.com/_/postgres)
- [PostgreSQL 18 PGDATA Error Fix](https://aronschueler.de/blog/2025/10/30/fixing-postgres-18-docker-compose-startup/)
- [Docker Library PostgreSQL Issue #1370](https://github.com/docker-library/postgres/issues/1370)
- [Upgrade PostgreSQL 17 to 18 on Docker](https://henrywithu.com/upgrade-postgresql-from-17-to-18-on-docker/)
