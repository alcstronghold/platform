import {
  createPermission,
  createPolicy,
  createRole,
  deletePermission,
  deleteRole,
  readPermissions,
  readPolicies,
  readRoles,
  updatePolicy,
} from '@directus/sdk';

import { createClient } from '../services/directus';
import type { DirectusConfig } from '../types';
import { log } from '../utils';

export interface RolesSetupOptions {
  dryRun?: boolean;
}

// =============================================================================
// TYPES
// =============================================================================

interface RoleDefinition {
  name: string;
  icon: string;
  description: string;
  admin_access: boolean;
  app_access: boolean;
}

interface PolicyDefinition {
  name: string;
  icon: string;
  description: string;
  permissions: PermissionDefinition[];
}

interface PermissionDefinition {
  collection: string;
  action: 'create' | 'read' | 'update' | 'delete';
  fields?: string[] | ['*'];
  permissions?: Record<string, unknown> | null;
  validation?: Record<string, unknown> | null;
}

// =============================================================================
// COLLECTION GROUPS
// =============================================================================

/** Colecciones de contenido del catálogo (solo lectura para members) */
const CONTENT_COLLECTIONS = [
  'genres',
  'genres_translations',
  'publishers',
  'publishers_translations',
  'settings',
  'settings_translations',
  'settings_genres',
  'rpg_families',
  'rpg_families_translations',
  'rpg_families_settings',
  'rpg_systems',
  'rpg_systems_translations',
  'rpg_editions',
  'rpg_editions_translations',
  'languages',
  // Colecciones auxiliares para formulario de sesiones
  'age_ranges',
  'age_ranges_translations',
  'knowledge_levels',
  'knowledge_levels_translations',
  'accessibility_options',
  'accessibility_options_translations',
  'session_languages',
  'session_languages_translations',
  'content_warnings',
  'content_warnings_translations',
  'safety_measures',
  'safety_measures_translations',
];

/** M2M junctions de rpg_sessions */
const SESSION_M2M_COLLECTIONS = [
  'rpg_sessions_genres',
  'rpg_sessions_accessibility_options',
  'rpg_sessions_session_languages',
  'rpg_sessions_content_warnings',
  'rpg_sessions_safety_measures',
];

// =============================================================================
// PERMISSION FILTERS
// =============================================================================

/** Filtro para sesiones propias (master_id = usuario actual) */
const OWN_SESSION_FILTER = {
  _and: [{ master_id: { _eq: '$CURRENT_USER' } }],
};

/** Filtro para traducciones de sesiones propias */
const OWN_SESSION_TRANSLATION_FILTER = {
  _and: [{ rpg_sessions_id: { master_id: { _eq: '$CURRENT_USER' } } }],
};

/** Filtro para M2M junctions de sesiones propias */
const OWN_SESSION_M2M_FILTER = {
  _and: [{ rpg_sessions_id: { master_id: { _eq: '$CURRENT_USER' } } }],
};

// =============================================================================
// ROLES DEFINITIONS
// =============================================================================

/**
 * Roles de la asociación ALC Stronghold:
 * - Administrator: acceso total a Directus y al dashboard
 * - User: usuario registrado, recibe permisos via policies
 */
const ROLES: Record<string, RoleDefinition> = {
  administrator: {
    name: 'Administrator',
    icon: 'verified_user',
    description: 'Full access to Directus Admin, Backend dashboard, and Public website',
    admin_access: true,
    app_access: true,
  },
  user: {
    name: 'User',
    icon: 'person',
    description: 'Registered user. Permissions are granted via policies.',
    admin_access: false,
    app_access: false,
  },
};

/** Roles legacy que deben eliminarse si existen y no tienen usuarios asignados */
const LEGACY_ROLE_NAMES = ['Collaborator', 'Member'];

// =============================================================================
// POLICY DEFINITIONS
// =============================================================================

/**
 * Policies de la asociación ALC Stronghold.
 * Se asignan a usuarios directamente según su rol en la asociación.
 */
const POLICIES: Record<string, PolicyDefinition> = {
  member: {
    name: 'Member',
    icon: 'badge',
    description: 'Socio de la asociación. Lectura del catálogo de contenido.',
    permissions: [
      ...CONTENT_COLLECTIONS.map((collection) => ({
        collection,
        action: 'read' as const,
        fields: ['*'] as ['*'],
        permissions: {},
      })),
      {
        collection: 'directus_files',
        action: 'read' as const,
        fields: ['*'] as ['*'],
        permissions: {},
      },
      // Lectura de las asignaciones propias de policies (para cargar policies en el dashboard)
      {
        collection: 'directus_access',
        action: 'read' as const,
        fields: ['id', 'policy', 'user', 'role'] as any,
        permissions: {
          _or: [
            { user: { _eq: '$CURRENT_USER' } },
            { role: { _eq: '$CURRENT_ROLE' } },
          ],
        },
      },
      {
        collection: 'directus_policies',
        action: 'read' as const,
        fields: ['id', 'name'] as any,
        permissions: {},
      },
      // Lectura del propio usuario y su rol (necesario para el login del dashboard)
      {
        collection: 'directus_users',
        action: 'read' as const,
        fields: ['id', 'email', 'first_name', 'last_name', 'avatar', 'role'],
        permissions: { id: { _eq: '$CURRENT_USER' } },
      },
      {
        collection: 'directus_roles',
        action: 'read' as const,
        fields: ['id', 'name'],
        permissions: {},
      },
    ],
  },

  voluntario: {
    name: 'Voluntario',
    icon: 'volunteer_activism',
    description: 'Voluntario de la asociación. Permisos pendientes de definir.',
    permissions: [],
  },

  minion: {
    name: 'Minion',
    icon: 'emoji_people',
    description: 'Minion de la asociación. Permisos pendientes de definir.',
    permissions: [],
  },

  master: {
    name: 'Master',
    icon: 'sports_esports',
    description: 'Puede crear y gestionar sus propias sesiones de rol.',
    permissions: [
      // CRUD sesiones propias
      {
        collection: 'rpg_sessions',
        action: 'create',
        fields: ['*'],
        permissions: {},
        validation: OWN_SESSION_FILTER,
      },
      {
        collection: 'rpg_sessions',
        action: 'read',
        fields: ['*'],
        permissions: OWN_SESSION_FILTER,
      },
      {
        collection: 'rpg_sessions',
        action: 'update',
        fields: ['*'],
        permissions: OWN_SESSION_FILTER,
      },
      {
        collection: 'rpg_sessions',
        action: 'delete',
        permissions: OWN_SESSION_FILTER,
      },
      // CRUD traducciones de sesiones propias
      {
        collection: 'rpg_sessions_translations',
        action: 'create',
        fields: ['*'],
        permissions: {},
      },
      {
        collection: 'rpg_sessions_translations',
        action: 'read',
        fields: ['*'],
        permissions: OWN_SESSION_TRANSLATION_FILTER,
      },
      {
        collection: 'rpg_sessions_translations',
        action: 'update',
        fields: ['*'],
        permissions: OWN_SESSION_TRANSLATION_FILTER,
      },
      {
        collection: 'rpg_sessions_translations',
        action: 'delete',
        permissions: OWN_SESSION_TRANSLATION_FILTER,
      },
      // CRUD M2M junctions de sesiones propias
      ...SESSION_M2M_COLLECTIONS.flatMap((collection) => [
        {
          collection,
          action: 'create' as const,
          fields: ['*'] as ['*'],
          permissions: {},
        },
        {
          collection,
          action: 'read' as const,
          fields: ['*'] as ['*'],
          permissions: OWN_SESSION_M2M_FILTER,
        },
        {
          collection,
          action: 'update' as const,
          fields: ['*'] as ['*'],
          permissions: OWN_SESSION_M2M_FILTER,
        },
        {
          collection,
          action: 'delete' as const,
          permissions: OWN_SESSION_M2M_FILTER,
        },
      ]),
    ],
  },

  'comision-rol': {
    name: 'Comisión de Rol',
    icon: 'shield',
    description: 'Coordinadora de sesiones de rol. Puede ver todas las sesiones y usuarios.',
    permissions: [
      // Lectura de todas las sesiones
      {
        collection: 'rpg_sessions',
        action: 'read' as const,
        fields: ['*'] as ['*'],
        permissions: {},
      },
      {
        collection: 'rpg_sessions_translations',
        action: 'read' as const,
        fields: ['*'] as ['*'],
        permissions: {},
      },
      ...SESSION_M2M_COLLECTIONS.map((collection) => ({
        collection,
        action: 'read' as const,
        fields: ['*'] as ['*'],
        permissions: {},
      })),
      // Lectura de usuarios (para identificar masters y jugadores)
      {
        collection: 'directus_users',
        action: 'read' as const,
        fields: ['id', 'email', 'first_name', 'last_name', 'avatar'],
        permissions: {},
      },
    ],
  },
};

// =============================================================================
// DEFAULT POLICY ASSIGNMENTS
// =============================================================================

/**
 * Policies que se asignan por defecto a cada rol al crearlo.
 * Los administrators tienen admin_access; no necesitan policies.
 * Los usuarios normales reciben Member por defecto.
 */
const ROLE_DEFAULT_POLICIES: Record<string, string[]> = {
  administrator: [],
  user: ['member'],
};

// =============================================================================
// COMMAND IMPLEMENTATION
// =============================================================================

type DirectusClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Enlaza una policy a un rol via directus_access.
 * Verifica si el link ya existe para evitar duplicados.
 */
async function linkPolicyToRole(
  config: DirectusConfig,
  roleId: string,
  policyId: string
): Promise<boolean> {
  // Verificar si el link ya existe
  const checkUrl = `${config.url}/access?filter[role][_eq]=${roleId}&filter[policy][_eq]=${policyId}&limit=1`;
  const checkResponse = await fetch(checkUrl, {
    headers: { Authorization: `Bearer ${config.token}` },
  });

  if (checkResponse.ok) {
    const data = await checkResponse.json() as { data: unknown[] };
    if (data.data.length > 0) {
      return false; // Ya existe
    }
  }

  const response = await fetch(`${config.url}/access`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.token}`,
    },
    body: JSON.stringify({ role: roleId, policy: policyId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to link policy to role: ${JSON.stringify(error)}`);
  }

  return true; // Creado
}

/**
 * Elimina todos los permisos de una policy
 */
async function deletePolicyPermissions(
  client: DirectusClient,
  policyId: string,
  permissions: { id: number; policy: string | null }[],
  dryRun: boolean
): Promise<number> {
  const policyPermissions = permissions.filter((p) => p.policy === policyId);
  if (policyPermissions.length === 0) return 0;

  if (!dryRun) {
    for (const perm of policyPermissions) {
      await client.request(deletePermission(perm.id));
    }
  }

  return policyPermissions.length;
}

/**
 * Elimina los roles legacy (Collaborator, Member) si no tienen usuarios asignados.
 * Si tienen usuarios, registra un aviso sin fallar.
 */
async function cleanupLegacyRoles(
  client: DirectusClient,
  dryRun: boolean
): Promise<void> {
  log.info('Cleaning up legacy roles...');

  const existingRoles = await client.request(readRoles());
  const legacyRoles = existingRoles.filter((r) => LEGACY_ROLE_NAMES.includes(r.name));

  if (legacyRoles.length === 0) {
    log.item('skipped', 'No legacy roles found');
    return;
  }

  for (const role of legacyRoles) {
    if (dryRun) {
      log.item('deleted', `Would delete legacy role: ${role.name}`);
      continue;
    }

    try {
      await client.request(deleteRole(role.id));
      log.item('deleted', `Deleted legacy role: ${role.name}`);
    } catch {
      log.warn(`Could not delete role '${role.name}' — it may have users assigned. Remove users first.`);
    }
  }
}

/**
 * Busca los roles actuales por nombre
 */
async function findExistingRoles(
  client: DirectusClient
): Promise<Map<string, string>> {
  const existingRoles = await client.request(readRoles());
  const roleMap = new Map<string, string>();

  for (const [key, roleDef] of Object.entries(ROLES)) {
    const existing = existingRoles.find((r) => r.name === roleDef.name);
    if (existing) {
      roleMap.set(key, existing.id);
    }
  }

  return roleMap;
}

/**
 * Crea los permisos definidos para una policy
 */
async function createPolicyPermissions(
  client: DirectusClient,
  policyId: string,
  permissions: PermissionDefinition[]
): Promise<void> {
  for (const perm of permissions) {
    await client.request(
      createPermission({
        policy: policyId,
        collection: perm.collection,
        action: perm.action,
        fields: perm.fields,
        permissions: perm.permissions,
        validation: perm.validation,
      })
    );
  }
}

/**
 * Actualiza una policy existente: metadata y reemplazo completo de permisos
 */
async function updateExistingPolicy(
  client: DirectusClient,
  policyId: string,
  policyDef: PolicyDefinition,
  existingPermissions: { id: number; policy: string | null }[]
): Promise<void> {
  await client.request(
    updatePolicy(policyId, {
      icon: policyDef.icon,
      description: policyDef.description,
    })
  );

  const deletedCount = await deletePolicyPermissions(client, policyId, existingPermissions, false);
  await createPolicyPermissions(client, policyId, policyDef.permissions);
  log.item('updated', `Synced policy: ${policyDef.name} (${deletedCount} old → ${policyDef.permissions.length} new permissions)`);
}

/**
 * Crea una policy nueva con todos sus permisos
 */
async function createNewPolicy(
  client: DirectusClient,
  policyDef: PolicyDefinition
): Promise<string> {
  const policy = await client.request(
    createPolicy({
      name: policyDef.name,
      icon: policyDef.icon,
      description: policyDef.description,
      admin_access: false,
      app_access: false,
    })
  );

  await createPolicyPermissions(client, policy.id, policyDef.permissions);
  log.item('created', `Created policy: ${policyDef.name} (${policyDef.permissions.length} permissions)`);
  return policy.id;
}

interface SyncPolicyContext {
  client: DirectusClient;
  dryRun: boolean;
  existingPermissions: { id: number; policy: string | null }[];
}

/**
 * Sincroniza una policy individual: upsert si existe, crear si no.
 * Retorna el ID de la policy (existente o nuevo).
 */
async function syncSinglePolicy(
  ctx: SyncPolicyContext,
  key: string,
  policyDef: PolicyDefinition,
  existing: { id: string; name: string } | undefined
): Promise<string> {
  if (existing) {
    if (!ctx.dryRun) {
      await updateExistingPolicy(ctx.client, existing.id, policyDef, ctx.existingPermissions);
    } else {
      log.item('updated', `Would sync policy: ${policyDef.name} (${policyDef.permissions.length} permissions)`);
    }
    return existing.id;
  }

  if (ctx.dryRun) {
    log.item('created', `Would create policy: ${policyDef.name} (${policyDef.permissions.length} permissions)`);
    return `[dry-run-${key}]`;
  }

  return createNewPolicy(ctx.client, policyDef);
}

/**
 * Sincroniza todas las policies con patrón upsert.
 * Las policies existentes se actualizan (permisos reemplazados),
 * preservando sus IDs y las asignaciones de directus_access.
 */
async function syncAllPolicies(
  client: DirectusClient,
  dryRun: boolean
): Promise<Map<string, string>> {
  const syncedPolicies = new Map<string, string>();
  log.info('Syncing policies...');

  const existingPolicies = await client.request(readPolicies());
  const existingPermissions = await client.request(readPermissions()) as { id: number; policy: string | null }[];
  const ctx: SyncPolicyContext = { client, dryRun, existingPermissions };

  for (const [key, policyDef] of Object.entries(POLICIES)) {
    const existing = existingPolicies.find((p) => p.name === policyDef.name);
    const policyId = await syncSinglePolicy(ctx, key, policyDef, existing);
    syncedPolicies.set(key, policyId);
  }

  return syncedPolicies;
}

/**
 * Crea o reutiliza los roles y les asigna sus policies por defecto
 */
async function setupAllRoles(
  client: DirectusClient,
  config: DirectusConfig,
  existingRoles: Map<string, string>,
  syncedPolicies: Map<string, string>,
  dryRun: boolean
): Promise<Map<string, string>> {
  const createdRoles = new Map<string, string>(existingRoles);
  log.info('Setting up roles...');

  for (const [key, roleDef] of Object.entries(ROLES)) {
    const existingRoleId = createdRoles.get(key);

    if (existingRoleId) {
      log.item('skipped', `Using existing role: ${roleDef.name} (${existingRoleId})`);
    } else if (dryRun) {
      log.item('created', `Would create role: ${roleDef.name}`);
      createdRoles.set(key, `[dry-run-${key}]`);
    } else {
      const role = await client.request(
        createRole({
          name: roleDef.name,
          icon: roleDef.icon,
          description: roleDef.description,
        })
      );
      createdRoles.set(key, role.id);
      log.item('created', `Created role: ${roleDef.name} (${role.id})`);
    }

    await ensureDefaultPolicyLinks(config, key, createdRoles, syncedPolicies, dryRun);
  }

  return createdRoles;
}

/**
 * Asegura que las policies por defecto estén vinculadas al rol.
 * Verifica si el link ya existe para evitar duplicados.
 */
async function ensureDefaultPolicyLinks(
  config: DirectusConfig,
  roleKey: string,
  createdRoles: Map<string, string>,
  syncedPolicies: Map<string, string>,
  dryRun: boolean
): Promise<void> {
  const roleId = createdRoles.get(roleKey);
  const defaultPolicies = ROLE_DEFAULT_POLICIES[roleKey] ?? [];

  for (const policyKey of defaultPolicies) {
    const policyId = syncedPolicies.get(policyKey);
    if (!policyId || !roleId) continue;

    if (dryRun) {
      log.item('detail', `  → Would ensure link: ${POLICIES[policyKey].name}`);
      continue;
    }

    const wasCreated = await linkPolicyToRole(config, roleId, policyId);
    if (wasCreated) {
      log.item('detail', `  → Linked: ${POLICIES[policyKey].name}`);
    } else {
      log.item('skipped', `  → Already linked: ${POLICIES[policyKey].name}`);
    }
  }
}

/**
 * Imprime el resumen del setup
 */
function printSummary(): void {
  log.success('Setup completed!');

  log.summary('Roles:');
  for (const [key, roleDef] of Object.entries(ROLES)) {
    const defaultPolicies = ROLE_DEFAULT_POLICIES[key] ?? [];
    const policiesList = defaultPolicies.length > 0
      ? ` → [${defaultPolicies.join(', ')}]`
      : ' (admin_access)';
    log.item('success', `${roleDef.name}${policiesList}`);
  }

  log.summary('Policies:');
  for (const [_key, policyDef] of Object.entries(POLICIES)) {
    log.item('success', `${policyDef.name} (${policyDef.permissions.length} permissions)`);
  }

  log.info('');
  log.info('To assign additional policies to a user, use:');
  log.info('  POST /access { "user": "<user_id>", "policy": "<policy_id>" }');
}

/**
 * Configura roles y policies en Directus usando patrón upsert.
 * Las policies existentes se actualizan (permisos reemplazados),
 * preservando sus IDs y las asignaciones de usuarios en directus_access.
 */
export async function rolesSetupCommand(
  config: DirectusConfig,
  options: RolesSetupOptions
): Promise<void> {
  const client = await createClient(config);
  const dryRun = options.dryRun ?? false;

  log.header('ROLES & POLICIES SETUP');
  if (dryRun) {
    log.warn('DRY RUN - No changes will be made');
  }

  try {
    await cleanupLegacyRoles(client, dryRun);

    const existingRoles = await findExistingRoles(client);
    if (existingRoles.size > 0) {
      log.info(`Found ${existingRoles.size} existing role(s) - will reuse them`);
    }

    const syncedPolicies = await syncAllPolicies(client, dryRun);
    await setupAllRoles(client, config, existingRoles, syncedPolicies, dryRun);
    printSummary();
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log.error(`Failed to setup roles: ${msg}`);
    throw error;
  }
}
