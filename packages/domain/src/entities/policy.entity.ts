/**
 * Policy de Directus: define permisos granulares
 */
export interface Policy {
  id: string;
  name: string;
  description: string | null;
}

/**
 * Asignación de policy a un usuario (registro en directus_access)
 */
export interface PolicyAssignment {
  id: string;
  userId: string;
  policyId: string;
  policyName: string;
}
