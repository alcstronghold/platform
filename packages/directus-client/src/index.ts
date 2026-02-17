// Client factory
export type { DirectusAuthClient, DirectusClientConfig } from './client.js';
export { createBrowserClient, createServerClient } from './client.js';

// Auth adapter
export { DirectusAuthAdapter } from './auth.adapter.js';

// User management adapter
export { DirectusUserManagementAdapter } from './user-management.adapter.js';
