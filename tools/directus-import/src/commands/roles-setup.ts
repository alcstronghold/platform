import {
  createPermission,
  createPolicy,
  createRole,
  deletePermission,
  deletePolicy,
  readPermissions,
  readPolicies,
  readRoles,
} from '@directus/sdk';

import { createClient } from '../services/directus';
import type { DirectusConfig } from '../types';
import { log } from '../utils';

export interface RolesSetupOptions {
  dryRun?: boolean;
  clean?: boolean;
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

/** Auxiliary enum collections (read-only reference data) */
const AUXILIARY_COLLECTIONS = [
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
  'pronouns',
  'pronouns_translations',
  'membership_statuses',
  'membership_statuses_translations',
  'gender_identities',
  'gender_identities_translations',
  'lgbtiq_options',
  'lgbtiq_options_translations',
  'discovery_sources',
  'discovery_sources_translations',
];

/** Content collections (catalog data) */
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
];

/** RPG Sessions M2M junction tables */
const SESSION_M2M_COLLECTIONS = [
  'rpg_sessions_genres',
  'rpg_sessions_accessibility_options',
  'rpg_sessions_session_languages',
  'rpg_sessions_content_warnings',
  'rpg_sessions_safety_measures',
];

// =============================================================================
// ROLES DEFINITIONS
// =============================================================================

/**
 * Roles define ACCESS LEVELS to applications:
 * - Administrator: Full access to Directus Admin + Backend + Public
 * - Collaborator: Access to Backend + Public (no Directus Admin)
 * - Member: Access to Public only (registered users)
 */
const ROLES: Record<string, RoleDefinition> = {
  administrator: {
    name: 'Administrator',
    icon: 'verified_user',
    description: 'Full access to Directus Admin, Backend dashboard, and Public website',
    admin_access: true,
    app_access: true,
  },
  collaborator: {
    name: 'Collaborator',
    icon: 'badge',
    description: 'Access to Backend dashboard and Public website (no Directus Admin)',
    admin_access: false,
    app_access: true,
  },
  member: {
    name: 'Member',
    icon: 'person',
    description: 'Registered user with access to Public website and API',
    admin_access: false,
    app_access: false,
  },
};

// =============================================================================
// PERMISSION FILTERS
// =============================================================================

/** Filter for own sessions (master_id = current user) */
const OWN_SESSION_FILTER = {
  _and: [{ master_id: { _eq: '$CURRENT_USER' } }],
};

/** Filter for translations of own sessions */
const OWN_SESSION_TRANSLATION_FILTER = {
  _and: [{ rpg_sessions_id: { master_id: { _eq: '$CURRENT_USER' } } }],
};

/** Filter for M2M junctions of own sessions */
const OWN_SESSION_M2M_FILTER = {
  _and: [{ rpg_sessions_id: { master_id: { _eq: '$CURRENT_USER' } } }],
};

/** Filter for players of own sessions */
const OWN_SESSION_PLAYERS_FILTER = {
  _and: [{ session_id: { master_id: { _eq: '$CURRENT_USER' } } }],
};

/** Filter for own user profile */
const OWN_PROFILE_FILTER = {
  _and: [{ user_id: { _eq: '$CURRENT_USER' } }],
};

/** Filter for own player registrations */
const OWN_PLAYER_REGISTRATION_FILTER = {
  _and: [{ user_id: { _eq: '$CURRENT_USER' } }],
};

// =============================================================================
// POLICY DEFINITIONS
// =============================================================================

/**
 * Policies define GRANULAR PERMISSIONS for specific features.
 * They can be attached to roles or directly to users.
 */
const POLICIES: Record<string, PolicyDefinition> = {
  // -------------------------------------------------------------------------
  // BASE POLICIES
  // -------------------------------------------------------------------------
  'base:content-reader': {
    name: 'Base: Content Reader',
    icon: 'menu_book',
    description: 'Read access to public content (genres, systems, settings, etc.)',
    permissions: [
      // Auxiliary collections
      ...AUXILIARY_COLLECTIONS.map((collection) => ({
        collection,
        action: 'read' as const,
        fields: ['*'] as ['*'],
        permissions: {},
      })),
      // Content collections
      ...CONTENT_COLLECTIONS.map((collection) => ({
        collection,
        action: 'read' as const,
        fields: ['*'] as ['*'],
        permissions: {},
      })),
      // Directus system collections
      {
        collection: 'directus_files',
        action: 'read' as const,
        fields: ['*'] as ['*'],
        permissions: {},
      },
    ],
  },

  // -------------------------------------------------------------------------
  // USER PROFILES POLICIES
  // -------------------------------------------------------------------------
  'user-profiles:self': {
    name: 'User Profiles: Self',
    icon: 'person',
    description: 'Manage own user profile',
    permissions: [
      // Read own profile
      {
        collection: 'user_profiles',
        action: 'read',
        fields: ['*'],
        permissions: OWN_PROFILE_FILTER,
      },
      // Update own profile
      {
        collection: 'user_profiles',
        action: 'update',
        fields: ['*'],
        permissions: OWN_PROFILE_FILTER,
      },
      // Create own profile (first time)
      {
        collection: 'user_profiles',
        action: 'create',
        fields: ['*'],
        permissions: {},
        validation: OWN_PROFILE_FILTER,
      },
      // M2M: discovery sources
      {
        collection: 'user_profiles_discovery_sources',
        action: 'create',
        fields: ['*'],
        permissions: {},
      },
      {
        collection: 'user_profiles_discovery_sources',
        action: 'read',
        fields: ['*'],
        permissions: { _and: [{ user_profiles_id: { user_id: { _eq: '$CURRENT_USER' } } }] },
      },
      {
        collection: 'user_profiles_discovery_sources',
        action: 'delete',
        permissions: { _and: [{ user_profiles_id: { user_id: { _eq: '$CURRENT_USER' } } }] },
      },
      // Read basic user info
      {
        collection: 'directus_users',
        action: 'read',
        fields: ['id', 'email', 'first_name', 'last_name', 'avatar'],
        permissions: {},
      },
    ],
  },

  // -------------------------------------------------------------------------
  // RPG SESSIONS POLICIES
  // -------------------------------------------------------------------------
  'rpg-sessions:player': {
    name: 'RPG Sessions: Player',
    icon: 'groups',
    description: 'Register as player in RPG sessions',
    permissions: [
      // Read published sessions
      {
        collection: 'rpg_sessions',
        action: 'read',
        fields: ['*'],
        permissions: { _and: [{ status: { _eq: 'published' } }] },
      },
      {
        collection: 'rpg_sessions_translations',
        action: 'read',
        fields: ['*'],
        permissions: { _and: [{ rpg_sessions_id: { status: { _eq: 'published' } } }] },
      },
      // Read session M2M junctions
      ...SESSION_M2M_COLLECTIONS.map((collection) => ({
        collection,
        action: 'read' as const,
        fields: ['*'] as ['*'],
        permissions: { _and: [{ rpg_sessions_id: { status: { _eq: 'published' } } }] },
      })),
      // Register as player
      {
        collection: 'rpg_session_players',
        action: 'create',
        fields: ['*'],
        permissions: {},
        validation: OWN_PLAYER_REGISTRATION_FILTER,
      },
      // Read own registrations
      {
        collection: 'rpg_session_players',
        action: 'read',
        fields: ['*'],
        permissions: OWN_PLAYER_REGISTRATION_FILTER,
      },
      // Cancel own registration
      {
        collection: 'rpg_session_players',
        action: 'update',
        fields: ['status'],
        permissions: OWN_PLAYER_REGISTRATION_FILTER,
      },
    ],
  },

  'rpg-sessions:master': {
    name: 'RPG Sessions: Master',
    icon: 'sports_esports',
    description: 'Create and manage own RPG sessions',
    permissions: [
      // CRUD own sessions
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
      // CRUD own session translations
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
      // CRUD M2M junctions for own sessions
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
      // Read players registered to own sessions
      {
        collection: 'rpg_session_players',
        action: 'read',
        fields: ['*'],
        permissions: OWN_SESSION_PLAYERS_FILTER,
      },
      // Update player status in own sessions (approve, waitlist, etc.)
      {
        collection: 'rpg_session_players',
        action: 'update',
        fields: ['status'],
        permissions: OWN_SESSION_PLAYERS_FILTER,
      },
    ],
  },

  'rpg-sessions:moderator': {
    name: 'RPG Sessions: Moderator',
    icon: 'shield',
    description: 'Moderate all RPG sessions',
    permissions: [
      // Full CRUD on all sessions
      ...(['create', 'read', 'update', 'delete'] as const).map((action) => ({
        collection: 'rpg_sessions',
        action,
        fields: ['*'] as ['*'],
        permissions: {},
      })),
      // Full CRUD on translations
      ...(['create', 'read', 'update', 'delete'] as const).map((action) => ({
        collection: 'rpg_sessions_translations',
        action,
        fields: ['*'] as ['*'],
        permissions: {},
      })),
      // Full CRUD on M2M junctions
      ...SESSION_M2M_COLLECTIONS.flatMap((collection) =>
        (['create', 'read', 'update', 'delete'] as const).map((action) => ({
          collection,
          action,
          fields: ['*'] as ['*'],
          permissions: {},
        }))
      ),
      // Full CRUD on player registrations
      ...(['create', 'read', 'update', 'delete'] as const).map((action) => ({
        collection: 'rpg_session_players',
        action,
        fields: ['*'] as ['*'],
        permissions: {},
      })),
      // Read all user profiles (for moderation)
      {
        collection: 'user_profiles',
        action: 'read',
        fields: ['*'],
        permissions: {},
      },
      // Read users (for display)
      {
        collection: 'directus_users',
        action: 'read',
        fields: ['id', 'email', 'first_name', 'last_name', 'avatar', 'status'],
        permissions: {},
      },
    ],
  },

  // -------------------------------------------------------------------------
  // CONTENT MODERATION POLICIES
  // -------------------------------------------------------------------------
  'content:moderator': {
    name: 'Content: Moderator',
    icon: 'edit_note',
    description: 'Moderate catalog content (genres, systems, settings, etc.)',
    permissions: [
      // Full CRUD on auxiliary collections
      ...AUXILIARY_COLLECTIONS.flatMap((collection) =>
        (['create', 'read', 'update', 'delete'] as const).map((action) => ({
          collection,
          action,
          fields: ['*'] as ['*'],
          permissions: {},
        }))
      ),
      // Full CRUD on content collections
      ...CONTENT_COLLECTIONS.flatMap((collection) =>
        (['create', 'read', 'update', 'delete'] as const).map((action) => ({
          collection,
          action,
          fields: ['*'] as ['*'],
          permissions: {},
        }))
      ),
    ],
  },

  'user-profiles:moderator': {
    name: 'User Profiles: Moderator',
    icon: 'manage_accounts',
    description: 'Moderate all user profiles',
    permissions: [
      // Full CRUD on user profiles
      ...(['create', 'read', 'update', 'delete'] as const).map((action) => ({
        collection: 'user_profiles',
        action,
        fields: ['*'] as ['*'],
        permissions: {},
      })),
      // Full CRUD on M2M
      ...(['create', 'read', 'update', 'delete'] as const).map((action) => ({
        collection: 'user_profiles_discovery_sources',
        action,
        fields: ['*'] as ['*'],
        permissions: {},
      })),
      // Read users
      {
        collection: 'directus_users',
        action: 'read',
        fields: ['id', 'email', 'first_name', 'last_name', 'avatar', 'role', 'status'],
        permissions: {},
      },
      // Read roles
      {
        collection: 'directus_roles',
        action: 'read',
        fields: ['id', 'name', 'icon'],
        permissions: {},
      },
    ],
  },
};

// =============================================================================
// DEFAULT POLICY ASSIGNMENTS
// =============================================================================

/**
 * Default policies to attach to each role
 */
const ROLE_DEFAULT_POLICIES: Record<string, string[]> = {
  // Administrator has admin_access, so no policies needed
  administrator: [],
  // Collaborator gets base content reading
  collaborator: ['base:content-reader'],
  // Member gets base content + self profile + player
  member: ['base:content-reader', 'user-profiles:self', 'rpg-sessions:player'],
};

// =============================================================================
// COMMAND IMPLEMENTATION
// =============================================================================

/**
 * Link a policy to a role via directus_access
 */
async function linkPolicyToRole(
  config: DirectusConfig,
  roleId: string,
  policyId: string
): Promise<void> {
  const response = await fetch(`${config.url}/access`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.token}`,
    },
    body: JSON.stringify({
      role: roleId,
      policy: policyId,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to link policy to role: ${JSON.stringify(error)}`);
  }
}

/**
 * Clean up existing policies (roles are kept if they have users)
 */
async function cleanupPolicies(
  client: ReturnType<typeof createClient> extends Promise<infer T> ? T : never,
  dryRun: boolean
): Promise<void> {
  log.info('Cleaning up existing policies...');

  const existingPolicies = await client.request(readPolicies());
  const existingPermissions = await client.request(readPermissions());

  // Delete custom policies (permissions will be recreated)
  const customPolicyNames = Object.values(POLICIES).map((p) => p.name);
  for (const policy of existingPolicies) {
    if (customPolicyNames.includes(policy.name)) {
      // First delete permissions for this policy
      const policyPermissions = existingPermissions.filter((p) => p.policy === policy.id);
      for (const perm of policyPermissions) {
        if (!dryRun) {
          await client.request(deletePermission(perm.id));
        }
      }
      if (policyPermissions.length > 0) {
        log.item('-', `Deleted ${policyPermissions.length} permissions for ${policy.name}`);
      }

      if (dryRun) {
        log.item('-', `Would delete policy: ${policy.name}`);
      } else {
        await client.request(deletePolicy(policy.id));
        log.item('-', `Deleted policy: ${policy.name}`);
      }
    }
  }
}

/**
 * Find existing roles by name
 */
async function findExistingRoles(
  client: ReturnType<typeof createClient> extends Promise<infer T> ? T : never
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
 * Setup roles and policies
 */
export async function rolesSetupCommand(
  config: DirectusConfig,
  options: RolesSetupOptions
): Promise<void> {
  const client = await createClient(config);

  log.header('ROLES & POLICIES SETUP');
  if (options.dryRun) {
    log.warn('DRY RUN - No changes will be made');
  }

  try {
    // Find existing roles (we'll reuse them instead of recreating)
    const existingRoles = await findExistingRoles(client);
    if (existingRoles.size > 0) {
      log.info(`Found ${existingRoles.size} existing role(s) - will reuse them`);
    }

    // Clean up policies if requested or by default
    if (options.clean !== false) {
      await cleanupPolicies(client, options.dryRun ?? false);
    }

    // Track created/existing items
    const createdRoles: Map<string, string> = new Map(existingRoles);
    const createdPolicies: Map<string, string> = new Map();

    // -------------------------------------------------------------------------
    // 1. CREATE POLICIES
    // -------------------------------------------------------------------------
    log.info('Creating policies...');

    for (const [key, policyDef] of Object.entries(POLICIES)) {
      if (options.dryRun) {
        log.item('+', `Would create policy: ${policyDef.name} (${policyDef.permissions.length} permissions)`);
        createdPolicies.set(key, `[dry-run-${key}]`);
        continue;
      }

      // Create policy
      const policy = await client.request(
        createPolicy({
          name: policyDef.name,
          icon: policyDef.icon,
          description: policyDef.description,
          admin_access: false,
          app_access: false,
        })
      );
      createdPolicies.set(key, policy.id);
      log.item('+', `Created policy: ${policyDef.name}`);

      // Create permissions for this policy
      for (const perm of policyDef.permissions) {
        await client.request(
          createPermission({
            policy: policy.id,
            collection: perm.collection,
            action: perm.action,
            fields: perm.fields,
            permissions: perm.permissions,
            validation: perm.validation,
          })
        );
      }
      log.item('  ', `  → ${policyDef.permissions.length} permissions`);
    }

    // -------------------------------------------------------------------------
    // 2. CREATE OR REUSE ROLES
    // -------------------------------------------------------------------------
    log.info('Setting up roles...');

    for (const [key, roleDef] of Object.entries(ROLES)) {
      // Check if role already exists
      const existingRoleId = createdRoles.get(key);

      if (existingRoleId) {
        log.item('=', `Using existing role: ${roleDef.name} (${existingRoleId})`);
      } else if (options.dryRun) {
        log.item('+', `Would create role: ${roleDef.name}`);
        createdRoles.set(key, `[dry-run-${key}]`);
      } else {
        // Create new role
        const role = await client.request(
          createRole({
            name: roleDef.name,
            icon: roleDef.icon,
            description: roleDef.description,
            admin_access: roleDef.admin_access,
            app_access: roleDef.app_access,
          })
        );
        createdRoles.set(key, role.id);
        log.item('+', `Created role: ${roleDef.name} (${role.id})`);
      }

      // Link default policies to role (always, to ensure policies are attached)
      const roleId = createdRoles.get(key);
      const defaultPolicies = ROLE_DEFAULT_POLICIES[key] || [];
      for (const policyKey of defaultPolicies) {
        const policyId = createdPolicies.get(policyKey);
        if (policyId && roleId && !options.dryRun) {
          await linkPolicyToRole(config, roleId, policyId);
          log.item('  ', `  → Linked: ${POLICIES[policyKey].name}`);
        }
      }
    }

    // -------------------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------------------
    log.success('Setup completed!');

    log.summary('Roles created:');
    for (const [key, roleDef] of Object.entries(ROLES)) {
      const defaultPolicies = ROLE_DEFAULT_POLICIES[key] || [];
      const policiesList = defaultPolicies.length > 0
        ? ` → [${defaultPolicies.join(', ')}]`
        : ' (admin_access)';
      log.item('✓', `${roleDef.name}${policiesList}`);
    }

    log.summary('Policies created:');
    for (const [_key, policyDef] of Object.entries(POLICIES)) {
      log.item('✓', `${policyDef.name} (${policyDef.permissions.length} permissions)`);
    }

    log.info('');
    log.info('To assign additional policies to a user, use:');
    log.info('  POST /access { "user": "<user_id>", "policy": "<policy_id>" }');
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log.error(`Failed to setup roles: ${msg}`);
    throw error;
  }
}
