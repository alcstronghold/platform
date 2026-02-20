import type {
  CreateRpgSessionData,
  RpgSessionDetail,
  RpgSessionSummary,
  UpdateRpgSessionData,
} from '../entities/rpg-session.entity.js';

/**
 * Filtros opcionales para el listado de sesiones
 */
export interface RpgSessionFilter {
  masterId?: string;
}

/**
 * Puerto para la gestión de sesiones de rol
 */
export interface RpgSessionPort {
  listSessions(filter?: RpgSessionFilter): Promise<RpgSessionSummary[]>;
  getSession(id: string): Promise<RpgSessionDetail | null>;
  createSession(masterId: string, data: CreateRpgSessionData): Promise<RpgSessionDetail>;
  updateSession(data: UpdateRpgSessionData): Promise<RpgSessionDetail>;
  deleteSession(id: string): Promise<void>;
}
