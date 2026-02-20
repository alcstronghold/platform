import type {
  CreateRpgSessionData,
  RpgSessionDetail,
  RpgSessionFilter,
  RpgSessionPort,
  RpgSessionSummary,
  UpdateRpgSessionData,
} from '@alcstronghold/domain';
import { CreateSessionUseCase, type CreateSessionResult, UpdateSessionUseCase, type UpdateSessionResult } from '@alcstronghold/domain';
import { computed, inject, Injectable, signal } from '@angular/core';

import { RPG_SESSION_PORT } from '../providers/directus.provider';

interface RpgSessionState {
  sessions: RpgSessionSummary[];
  currentSession: RpgSessionDetail | null;
  isLoading: boolean;
  error: string | null;
}

@Injectable({ providedIn: 'root' })
export class RpgSessionService {
  private readonly port: RpgSessionPort = inject(RPG_SESSION_PORT);

  private readonly state = signal<RpgSessionState>({
    sessions: [],
    currentSession: null,
    isLoading: false,
    error: null,
  });

  readonly sessions = computed(() => this.state().sessions);
  readonly currentSession = computed(() => this.state().currentSession);
  readonly isLoading = computed(() => this.state().isLoading);
  readonly error = computed(() => this.state().error);

  async loadSessions(filter?: RpgSessionFilter): Promise<void> {
    this.patchState({ isLoading: true, error: null });
    try {
      const sessions = await this.port.listSessions(filter);
      this.patchState({ sessions, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al cargar sesiones';
      this.patchState({ isLoading: false, error: message });
    }
  }

  async loadSession(id: string): Promise<void> {
    this.patchState({ isLoading: true, error: null });
    try {
      const session = await this.port.getSession(id);
      this.patchState({ currentSession: session, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al cargar la sesión';
      this.patchState({ isLoading: false, error: message });
    }
  }

  async createSession(masterId: string, data: CreateRpgSessionData): Promise<CreateSessionResult> {
    const useCase = new CreateSessionUseCase(this.port);
    const result = await useCase.execute(masterId, data);

    if (result.success) {
      await this.loadSessions();
    }

    return result;
  }

  async updateSession(data: UpdateRpgSessionData): Promise<UpdateSessionResult> {
    const useCase = new UpdateSessionUseCase(this.port);
    const result = await useCase.execute(data);

    if (result.success) {
      await this.loadSessions();
    }

    return result;
  }

  async deleteSession(id: string): Promise<void> {
    await this.port.deleteSession(id);
    await this.loadSessions();
  }

  private patchState(patch: Partial<RpgSessionState>): void {
    this.state.update(current => ({ ...current, ...patch }));
  }
}
