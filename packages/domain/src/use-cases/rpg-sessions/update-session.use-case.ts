import type { RpgSessionDetail } from '../../entities/rpg-session.entity.js';
import type { RpgSessionPort } from '../../ports/rpg-session.port.js';
import { CreateRpgSessionDataSchema } from './create-session.use-case.js';

export interface UpdateSessionResult {
  success: boolean;
  session?: RpgSessionDetail;
  error?: string;
}

export class UpdateSessionUseCase {
  constructor(private readonly port: RpgSessionPort) {}

  async execute(data: {
    id: string;
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
  }): Promise<UpdateSessionResult> {
    if (!data.id) {
      return { success: false, error: 'El ID de la sesión es obligatorio' };
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
      const session = await this.port.updateSession({ ...validation.data, id: data.id });
      return { success: true, session };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al actualizar la sesión';
      return { success: false, error: message };
    }
  }
}
