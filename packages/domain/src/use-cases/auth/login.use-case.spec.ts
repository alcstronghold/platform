import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AuthPort, AuthResult } from '../../ports';
import { LoginUseCase } from './login.use-case';

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;
  let mockAuthPort: AuthPort;

  beforeEach(() => {
    mockAuthPort = {
      login: vi.fn(),
      logout: vi.fn(),
      refreshToken: vi.fn(),
      getCurrentUser: vi.fn(),
    };
    useCase = new LoginUseCase(mockAuthPort);
  });

  describe('email validation', () => {
    it('should reject empty email', async () => {
      const result = await useCase.execute({ email: '', password: 'pass123' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('email');
      expect(mockAuthPort.login).not.toHaveBeenCalled();
    });

    it('should reject whitespace-only email', async () => {
      const result = await useCase.execute({ email: '   ', password: 'pass123' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('email');
      expect(mockAuthPort.login).not.toHaveBeenCalled();
    });

    it('should reject invalid email format without @', async () => {
      const result = await useCase.execute({ email: 'invalid-email', password: 'pass123' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('email');
      expect(mockAuthPort.login).not.toHaveBeenCalled();
    });

    it('should reject invalid email format without domain', async () => {
      const result = await useCase.execute({ email: 'user@', password: 'pass123' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('email');
      expect(mockAuthPort.login).not.toHaveBeenCalled();
    });

    it('should reject invalid email format without local part', async () => {
      const result = await useCase.execute({ email: '@example.com', password: 'pass123' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('email');
      expect(mockAuthPort.login).not.toHaveBeenCalled();
    });

    it('should accept valid email', async () => {
      vi.mocked(mockAuthPort.login).mockResolvedValue({ success: true });

      const result = await useCase.execute({
        email: 'user@example.com',
        password: 'pass123',
      });

      expect(mockAuthPort.login).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'pass123',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('password validation', () => {
    it('should reject empty password', async () => {
      const result = await useCase.execute({
        email: 'user@example.com',
        password: '',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('contraseña');
      expect(mockAuthPort.login).not.toHaveBeenCalled();
    });
  });

  describe('email normalization', () => {
    it('should normalize email (trim and lowercase)', async () => {
      vi.mocked(mockAuthPort.login).mockResolvedValue({ success: true });

      await useCase.execute({
        email: '  USER@EXAMPLE.COM  ',
        password: 'pass123',
      });

      expect(mockAuthPort.login).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'pass123',
      });
    });

    it('should handle mixed case emails', async () => {
      vi.mocked(mockAuthPort.login).mockResolvedValue({ success: true });

      await useCase.execute({
        email: 'Test.User@ExAmPlE.CoM',
        password: 'pass123',
      });

      expect(mockAuthPort.login).toHaveBeenCalledWith({
        email: 'test.user@example.com',
        password: 'pass123',
      });
    });
  });

  describe('auth port integration', () => {
    it('should propagate successful auth result', async () => {
      const mockResult: AuthResult = {
        success: true,
        user: {
          id: '123',
          email: 'user@example.com',
          firstName: 'John',
          lastName: 'Doe',
          avatar: null,
          status: 'active',
          displayName: 'John Doe',
        },
      };
      vi.mocked(mockAuthPort.login).mockResolvedValue(mockResult);

      const result = await useCase.execute({
        email: 'user@example.com',
        password: 'correct',
      });

      expect(result).toEqual(mockResult);
    });

    it('should propagate auth port errors', async () => {
      vi.mocked(mockAuthPort.login).mockResolvedValue({
        success: false,
        error: 'Invalid credentials',
      });

      const result = await useCase.execute({
        email: 'user@example.com',
        password: 'wrong',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
    });

    it('should handle auth port exceptions', async () => {
      vi.mocked(mockAuthPort.login).mockRejectedValue(new Error('Network error'));

      await expect(
        useCase.execute({
          email: 'user@example.com',
          password: 'pass123',
        })
      ).rejects.toThrow('Network error');
    });
  });

  describe('edge cases', () => {
    it('should handle special characters in email', async () => {
      vi.mocked(mockAuthPort.login).mockResolvedValue({ success: true });

      await useCase.execute({
        email: 'user+test@example.co.uk',
        password: 'pass123',
      });

      expect(mockAuthPort.login).toHaveBeenCalledWith({
        email: 'user+test@example.co.uk',
        password: 'pass123',
      });
    });

    it('should preserve password as-is (no normalization)', async () => {
      vi.mocked(mockAuthPort.login).mockResolvedValue({ success: true });

      await useCase.execute({
        email: 'user@example.com',
        password: '  PassW0rd!  ',
      });

      expect(mockAuthPort.login).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: '  PassW0rd!  ',
      });
    });
  });
});
