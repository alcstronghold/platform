import { z } from 'zod';

import type { RpgSessionDetail } from '../../entities/rpg-session.entity.js';
import type { RpgSessionPort } from '../../ports/rpg-session.port.js';

/**
 * Schema de validación para crear una sesión de rol
 */
export const CreateRpgSessionDataSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'El título es obligatorio'),
    slogan: z.string().nullable(),
    synopsis: z.string().nullable(),
    rpgFamilyId: z.string().nullable(),
    rpgEditionId: z.string().nullable(),
    rpgSystemId: z.string().nullable(),
    settingId: z.string().nullable(),
    ageRangeId: z
      .string()
      .min(1, 'El rango de edad es obligatorio'),
    knowledgeLevelId: z
      .string()
      .min(1, 'El nivel de conocimiento es obligatorio'),
    knowledgeLevelOther: z.string().nullable(),
    minPlayers: z
      .number()
      .int()
      .min(1, 'El mínimo de jugadores debe ser al menos 1'),
    maxPlayers: z
      .number()
      .int()
      .min(1, 'El máximo de jugadores debe ser al menos 1'),
    minDurationMinutes: z
      .number()
      .int()
      .min(1, 'La duración mínima debe ser al menos 1 minuto'),
    maxDurationMinutes: z
      .number()
      .int()
      .min(1, 'La duración máxima debe ser al menos 1 minuto'),
    comments: z.string().nullable(),
    genreIds: z.array(z.string()),
    accessibilityOptionIds: z.array(z.string()),
    languageIds: z.array(z.string()),
    contentWarningIds: z.array(z.string()),
    safetyMeasureIds: z.array(z.string()),
  })
  .refine(
    (data) => data.maxPlayers >= data.minPlayers,
    { message: 'El máximo de jugadores debe ser mayor o igual al mínimo', path: ['maxPlayers'] },
  )
  .refine(
    (data) => data.maxDurationMinutes >= data.minDurationMinutes,
    { message: 'La duración máxima debe ser mayor o igual a la mínima', path: ['maxDurationMinutes'] },
  );

export interface CreateSessionResult {
  success: boolean;
  session?: RpgSessionDetail;
  error?: string;
}

export class CreateSessionUseCase {
  constructor(private readonly port: RpgSessionPort) {}

  async execute(masterId: string, data: {
    title: string;
    slogan: string | null;
    synopsis: string | null;
    rpgFamilyId: string | null;
    rpgEditionId: string | null;
    rpgSystemId: string | null;
    settingId: string | null;
    ageRangeId: string;
    knowledgeLevelId: string;
    knowledgeLevelOther: string | null;
    minPlayers: number;
    maxPlayers: number;
    minDurationMinutes: number;
    maxDurationMinutes: number;
    comments: string | null;
    genreIds: string[];
    accessibilityOptionIds: string[];
    languageIds: string[];
    contentWarningIds: string[];
    safetyMeasureIds: string[];
  }): Promise<CreateSessionResult> {
    if (!masterId) {
      return { success: false, error: 'El ID del master es obligatorio' };
    }

    const validation = CreateRpgSessionDataSchema.safeParse(data);

    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return {
        success: false,
        error: firstError?.message ?? 'Error de validación',
      };
    }

    try {
      const session = await this.port.createSession(masterId, validation.data);
      return { success: true, session };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al crear la sesión';
      return { success: false, error: message };
    }
  }
}
