import type { AuthPort } from '@alcstronghold/domain';
import type { AuthenticatedUser } from '@alcstronghold/domain';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AUTH_PORT } from '../providers/directus.provider';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let mockAuthPort: AuthPort;

  beforeEach(() => {
    // Mock del AuthPort
    mockAuthPort = {
      login: vi.fn(),
      logout: vi.fn(),
      refreshToken: vi.fn(),
      getCurrentUser: vi.fn(),
    };

    // Configurar TestBed
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: AUTH_PORT, useValue: mockAuthPort },
      ],
    });

    service = TestBed.inject(AuthService);
  });

  describe('initialize', () => {
    it('should set user when valid session exists', async () => {
      const mockUser: AuthenticatedUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        avatar: null,
        displayName: 'Test User',
      };

      vi.mocked(mockAuthPort.getCurrentUser).mockResolvedValue(mockUser);

      await service.initialize();

      expect(service.user()).toBe(mockUser);
      expect(service.isAuthenticated()).toBe(true);
      expect(service.isLoading()).toBe(false);
    });

    it('should set user to null when no session exists', async () => {
      vi.mocked(mockAuthPort.getCurrentUser).mockResolvedValue(null);

      await service.initialize();

      expect(service.user()).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should set user to null when session check fails', async () => {
      vi.mocked(mockAuthPort.getCurrentUser).mockRejectedValue(new Error('Network error'));

      await service.initialize();

      expect(service.user()).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
      expect(service.error()).toBeNull();
    });
  });

  describe('login', () => {
    it('should return true and set user when login succeeds', async () => {
      const mockUser: AuthenticatedUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        avatar: null,
        displayName: 'Test User',
      };

      vi.mocked(mockAuthPort.login).mockResolvedValue({
        success: true,
        user: mockUser,
      });

      const result = await service.login('test@example.com', 'password123');

      expect(result).toBe(true);
      expect(service.user()).toBe(mockUser);
      expect(service.isAuthenticated()).toBe(true);
      expect(service.error()).toBeNull();
    });

    it('should return false and set error when login fails', async () => {
      vi.mocked(mockAuthPort.login).mockResolvedValue({
        success: false,
        error: 'Invalid credentials',
      });

      const result = await service.login('test@example.com', 'wrong');

      expect(result).toBe(false);
      expect(service.user()).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
      expect(service.error()).toBe('Invalid credentials');
    });

    it('should clear previous error when attempting new login', async () => {
      // Primer login falla
      vi.mocked(mockAuthPort.login).mockResolvedValueOnce({
        success: false,
        error: 'Invalid credentials',
      });
      await service.login('test@example.com', 'wrong');
      expect(service.error()).toBe('Invalid credentials');

      // Segundo login (debe limpiar error)
      vi.mocked(mockAuthPort.login).mockResolvedValueOnce({
        success: true,
        user: {
          id: '1',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          avatar: null,
          displayName: 'Test User',
        },
      });

      await service.login('test@example.com', 'correct');
      expect(service.error()).toBeNull();
    });

    it('should use default error message when none provided', async () => {
      vi.mocked(mockAuthPort.login).mockResolvedValue({
        success: false,
      });

      await service.login('test@example.com', 'wrong');

      expect(service.error()).toBe('Error de autenticación');
    });
  });

  describe('logout', () => {
    it('should clear user and call authPort logout', async () => {
      // Simular usuario logueado
      vi.mocked(mockAuthPort.login).mockResolvedValue({
        success: true,
        user: {
          id: '1',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          avatar: null,
          displayName: 'Test User',
        },
      });
      await service.login('test@example.com', 'password123');

      // Logout
      await service.logout();

      expect(mockAuthPort.logout).toHaveBeenCalled();
      expect(service.user()).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should clear user even if logout fails', async () => {
      // Simular usuario logueado
      vi.mocked(mockAuthPort.login).mockResolvedValue({
        success: true,
        user: {
          id: '1',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          avatar: null,
          displayName: 'Test User',
        },
      });
      await service.login('test@example.com', 'password123');

      // Logout falla
      vi.mocked(mockAuthPort.logout).mockRejectedValue(new Error('Network error'));

      await service.logout();

      expect(service.user()).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
    });
  });

  describe('clearError', () => {
    it('should clear error message', async () => {
      vi.mocked(mockAuthPort.login).mockResolvedValue({
        success: false,
        error: 'Invalid credentials',
      });

      await service.login('test@example.com', 'wrong');
      expect(service.error()).toBe('Invalid credentials');

      service.clearError();

      expect(service.error()).toBeNull();
    });
  });

  describe('loading state', () => {
    it('should set isLoading to true during login', async () => {
      vi.mocked(mockAuthPort.login).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ success: true, user: {} as AuthenticatedUser }), 100)
          )
      );

      const loginPromise = service.login('test@example.com', 'password123');

      // Durante la ejecución debe estar en loading
      expect(service.isLoading()).toBe(true);

      await loginPromise;

      expect(service.isLoading()).toBe(false);
    });
  });
});
