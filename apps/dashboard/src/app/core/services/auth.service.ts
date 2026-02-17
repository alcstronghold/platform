import type { AuthenticatedUser } from '@alcstronghold/domain';
import { GetCurrentUserUseCase, LoginUseCase, LogoutUseCase } from '@alcstronghold/domain';
import { computed, inject, Injectable, signal } from '@angular/core';

import { AUTH_PORT } from '../providers/directus.provider';

export interface AuthState {
  user: AuthenticatedUser | null;
  isLoading: boolean;
  error: string | null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authPort = inject(AUTH_PORT);

  private readonly state = signal<AuthState>({
    user: null,
    isLoading: false,
    error: null,
  });

  readonly user = computed(() => this.state().user);
  readonly isLoading = computed(() => this.state().isLoading);
  readonly error = computed(() => this.state().error);
  readonly isAuthenticated = computed(() => this.state().user != null);

  async initialize(): Promise<void> {
    this.setLoading(true);
    try {
      // Refrescar el token almacenado en localStorage antes de obtener el usuario.
      // Sin esto, un access_token expirado haría fallar el readMe().
      await this.authPort.refreshToken();

      const getCurrentUserUseCase = new GetCurrentUserUseCase(this.authPort);
      const user = await getCurrentUserUseCase.execute();
      this.setState({ user, isLoading: false, error: null });
    } catch {
      this.setState({ user: null, isLoading: false, error: null });
    }
  }

  async login(email: string, password: string): Promise<boolean> {
    this.setState({ ...this.state(), isLoading: true, error: null });

    const loginUseCase = new LoginUseCase(this.authPort);
    const result = await loginUseCase.execute({ email, password });

    if (result.success && result.user != null) {
      this.setState({ user: result.user, isLoading: false, error: null });
      return true;
    }

    this.setState({
      user: null,
      isLoading: false,
      error: result.error ?? 'Error de autenticación',
    });
    return false;
  }

  async logout(): Promise<void> {
    this.setLoading(true);
    try {
      const logoutUseCase = new LogoutUseCase(this.authPort);
      await logoutUseCase.execute();
      this.setState({ user: null, isLoading: false, error: null });
    } catch {
      this.setState({ user: null, isLoading: false, error: null });
    }
  }

  clearError(): void {
    this.setState({ ...this.state(), error: null });
  }

  private setLoading(isLoading: boolean): void {
    this.setState({ ...this.state(), isLoading });
  }

  private setState(newState: AuthState): void {
    this.state.set(newState);
  }
}