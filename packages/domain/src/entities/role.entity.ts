/**
 * Rol de Directus para gestión de usuarios.
 * En Directus 11, los roles solo tienen id y nombre;
 * el acceso se gestiona mediante políticas (policies).
 */
export interface Role {
  id: string;
  name: string;
}
