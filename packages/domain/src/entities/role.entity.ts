/**
 * Rol completo de Directus con niveles de acceso
 */
export interface Role {
  id: string;
  name: string;
  adminAccess: boolean;
  appAccess: boolean;
}
