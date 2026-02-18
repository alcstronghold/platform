import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AuthenticatedUser, AuthPort } from '../../ports';
import { GetCurrentUserUseCase } from './get-current-user.use-case';

describe('GetCurrentUserUseCase', () => {
  let useCase: GetCurrentUserUseCase;
  let mockAuthPort: AuthPort;

  beforeEach(() => {
    mockAuthPort = {
      login: vi.fn(),
      logout: vi.fn(),
      refreshToken: vi.fn(),
      getCurrentUser: vi.fn(),
    };
    useCase = new GetCurrentUserUseCase(mockAuthPort);
  });

  it('should return authenticated user when logged in', async () => {
    const mockUser: AuthenticatedUser = {
      id: '123',
      email: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
      avatar: null,
      status: 'active',
      displayName: 'John Doe',
    };
    vi.mocked(mockAuthPort.getCurrentUser).mockResolvedValue(mockUser);

    const result = await useCase.execute();

    expect(result).toEqual(mockUser);
    expect(mockAuthPort.getCurrentUser).toHaveBeenCalledOnce();
  });

  it('should return null when not logged in', async () => {
    vi.mocked(mockAuthPort.getCurrentUser).mockResolvedValue(null);

    const result = await useCase.execute();

    expect(result).toBeNull();
    expect(mockAuthPort.getCurrentUser).toHaveBeenCalledOnce();
  });

  it('should propagate errors from authPort', async () => {
    vi.mocked(mockAuthPort.getCurrentUser).mockRejectedValue(new Error('Network error'));

    await expect(useCase.execute()).rejects.toThrow('Network error');
  });

  it('should not call other auth methods', async () => {
    vi.mocked(mockAuthPort.getCurrentUser).mockResolvedValue(null);

    await useCase.execute();

    expect(mockAuthPort.login).not.toHaveBeenCalled();
    expect(mockAuthPort.logout).not.toHaveBeenCalled();
    expect(mockAuthPort.refreshToken).not.toHaveBeenCalled();
  });

  it('should handle user with avatar', async () => {
    const mockUser: AuthenticatedUser = {
      id: '456',
      email: 'jane@example.com',
      firstName: 'Jane',
      lastName: null,
      avatar: 'https://example.com/avatar.png',
      status: 'active',
      displayName: 'Jane',
    };
    vi.mocked(mockAuthPort.getCurrentUser).mockResolvedValue(mockUser);

    const result = await useCase.execute();

    expect(result).toEqual(mockUser);
    expect(result?.avatar).toBe('https://example.com/avatar.png');
  });
});
