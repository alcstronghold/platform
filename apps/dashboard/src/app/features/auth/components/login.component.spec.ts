import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AuthState } from '../../../core/services/auth.service';
import { AuthService } from '../../../core/services/auth.service';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let mockAuthService: {
    user: ReturnType<typeof signal<AuthState['user']>>;
    error: ReturnType<typeof signal<AuthState['error']>>;
    isLoading: ReturnType<typeof signal<boolean>>;
    isAuthenticated: ReturnType<typeof signal<boolean>>;
    login: ReturnType<typeof vi.fn>;
    clearError: ReturnType<typeof vi.fn>;
  };
  let mockRouter: Router;
  let mockActivatedRoute: Partial<ActivatedRoute>;

  beforeEach(() => {
    // Mock signals
    mockAuthService = {
      user: signal(null),
      error: signal(null),
      isLoading: signal(false),
      isAuthenticated: signal(false),
      login: vi.fn(),
      clearError: vi.fn(),
    };

    mockActivatedRoute = {
      snapshot: {
        queryParamMap: {
          get: vi.fn(),
        },
      } as never,
    };

    TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    });

    const fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    mockRouter = TestBed.inject(Router);
  });

  describe('form validation', () => {
    it('should have invalid form initially', () => {
      expect(component.descriptor.form().valid()).toBe(false);
    });

    it('should require email', () => {
      const emailField = component.descriptor.form.email();
      const hasRequiredError = emailField.errors().some((e) => e.message === 'El email es obligatorio');
      expect(hasRequiredError).toBe(true);

      component.descriptor.patchValue({ email: 'test@example.com' });
      const stillHasError = component.descriptor.form.email().errors().some((e) => e.message === 'El email es obligatorio');
      expect(stillHasError).toBe(false);
    });

    it('should validate email format', () => {
      component.descriptor.patchValue({ email: 'invalid-email' });
      let hasEmailError = component.descriptor.form.email().errors().some((e) => e.message === 'El formato del email no es válido');
      expect(hasEmailError).toBe(true);

      component.descriptor.patchValue({ email: 'valid@example.com' });
      hasEmailError = component.descriptor.form.email().errors().some((e) => e.message === 'El formato del email no es válido');
      expect(hasEmailError).toBe(false);
    });

    it('should require password', () => {
      const passwordField = component.descriptor.form.password();
      const hasRequiredError = passwordField.errors().some((e) => e.message === 'La contraseña es obligatoria');
      expect(hasRequiredError).toBe(true);

      component.descriptor.patchValue({ password: 'password123' });
      const stillHasError = component.descriptor.form.password().errors().some((e) => e.message === 'La contraseña es obligatoria');
      expect(stillHasError).toBe(false);
    });

    it('should validate password min length (6 characters)', () => {
      component.descriptor.patchValue({ password: '12345' });
      let hasMinLengthError = component.descriptor.form.password().errors().some((e) => e.message === 'La contraseña debe tener al menos 6 caracteres');
      expect(hasMinLengthError).toBe(true);

      component.descriptor.patchValue({ password: '123456' });
      hasMinLengthError = component.descriptor.form.password().errors().some((e) => e.message === 'La contraseña debe tener al menos 6 caracteres');
      expect(hasMinLengthError).toBe(false);
    });
  });

  describe('error messages', () => {
    it('should not show email error when untouched', () => {
      expect(component.emailError()).toBeNull();
    });

    it('should show required error for email when touched and empty', () => {
      component.descriptor.form.email().markAsTouched();

      expect(component.emailError()).toBe('El email es obligatorio');
    });

    it('should show format error for invalid email when touched', () => {
      component.descriptor.patchValue({ email: 'invalid' });
      component.descriptor.form.email().markAsTouched();

      expect(component.emailError()).toBe('El formato del email no es válido');
    });

    it('should not show password error when untouched', () => {
      expect(component.passwordError()).toBeNull();
    });

    it('should show required error for password when touched and empty', () => {
      component.descriptor.form.password().markAsTouched();

      expect(component.passwordError()).toBe('La contraseña es obligatoria');
    });

    it('should show minlength error for short password when touched', () => {
      component.descriptor.patchValue({ password: '123' });
      component.descriptor.form.password().markAsTouched();

      expect(component.passwordError()).toBe('La contraseña debe tener al menos 6 caracteres');
    });
  });

  describe('submit behavior', () => {
    it('should not submit when form is invalid', async () => {
      await component.login();

      expect(mockAuthService.login).not.toHaveBeenCalled();
      expect(component.descriptor.form.email().touched()).toBe(true);
      expect(component.descriptor.form.password().touched()).toBe(true);
    });

    it('should call authService.login with form values when valid', async () => {
      component.descriptor.patchValue({ email: 'test@example.com', password: 'password123' });
      mockAuthService.login.mockResolvedValue(true);
      vi.spyOn(mockRouter, 'navigate').mockResolvedValue(true);

      await component.login();

      expect(mockAuthService.login).toHaveBeenCalledWith('test@example.com', 'password123');
    });

    it('should clear error before submitting', async () => {
      component.descriptor.patchValue({ email: 'test@example.com', password: 'password123' });
      mockAuthService.login.mockResolvedValue(true);
      vi.spyOn(mockRouter, 'navigate').mockResolvedValue(true);

      await component.login();

      expect(mockAuthService.clearError).toHaveBeenCalled();
    });

    it('should set isSubmitting to true during login', async () => {
      component.descriptor.patchValue({ email: 'test@example.com', password: 'password123' });
      vi.spyOn(mockRouter, 'navigate').mockResolvedValue(true);

      mockAuthService.login.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(true), 100))
      );

      const submitPromise = component.login();

      expect(component.isSubmitting()).toBe(true);

      await submitPromise;

      expect(component.isSubmitting()).toBe(false);
    });
  });

  describe('redirect behavior after successful login', () => {
    beforeEach(() => {
      component.descriptor.patchValue({ email: 'test@example.com', password: 'password123' });
      mockAuthService.login.mockResolvedValue(true);
      vi.spyOn(mockRouter, 'navigateByUrl').mockResolvedValue(true);
      vi.spyOn(mockRouter, 'navigate').mockResolvedValue(true);
    });

    it('should redirect to /dashboard when no redirectUrl provided', async () => {
      vi.mocked(mockActivatedRoute.snapshot!.queryParamMap.get).mockReturnValue(null);

      await component.login();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
    });

    it('should redirect to redirectUrl when safe relative URL provided', async () => {
      vi.mocked(mockActivatedRoute.snapshot!.queryParamMap.get).mockReturnValue('/admin/users');

      await component.login();

      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/admin/users');
    });

    it('should ignore absolute external URL (security)', async () => {
      vi.mocked(mockActivatedRoute.snapshot!.queryParamMap.get).mockReturnValue(
        'https://evil.com'
      );

      await component.login();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
    });

    it('should ignore protocol-relative URL (security)', async () => {
      vi.mocked(mockActivatedRoute.snapshot!.queryParamMap.get).mockReturnValue('//evil.com');

      await component.login();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
    });

    it('should ignore redirect to /login (prevent loop)', async () => {
      vi.mocked(mockActivatedRoute.snapshot!.queryParamMap.get).mockReturnValue('/login');

      await component.login();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
    });
  });

  describe('failed login behavior', () => {
    it('should not navigate when login fails', async () => {
      component.descriptor.patchValue({ email: 'test@example.com', password: 'wrong' });
      mockAuthService.login.mockResolvedValue(false);

      vi.spyOn(mockRouter, 'navigate');

      await component.login();

      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });
  });
});
