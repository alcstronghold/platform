import { z } from 'zod';

import type { ManagedUser } from '../../entities/managed-user.entity.js';
import type { UserManagementPort } from '../../ports/user-management.port.js';

/**
 * Schema de validación para crear un usuario
 */
export const CreateUserDataSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'El email es obligatorio')
    .email('El formato del email no es válido')
    .toLowerCase(),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres'),
  firstName: z
    .string()
    .trim()
    .min(1, 'El nombre es obligatorio'),
  lastName: z
    .string()
    .trim()
    .min(1, 'El apellido es obligatorio'),
  roleId: z
    .string()
    .min(1, 'El rol es obligatorio'),
});

export interface CreateUserResult {
  success: boolean;
  user?: ManagedUser;
  error?: string;
}

export class CreateUserUseCase {
  constructor(private readonly port: UserManagementPort) {}

  async execute(data: { email: string; password: string; firstName: string; lastName: string; roleId: string }): Promise<CreateUserResult> {
    const validation = CreateUserDataSchema.safeParse(data);

    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return {
        success: false,
        error: firstError?.message ?? 'Error de validación',
      };
    }

    try {
      const user = await this.port.createUser(validation.data);
      return { success: true, user };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al crear el usuario';
      return { success: false, error: message };
    }
  }
}
