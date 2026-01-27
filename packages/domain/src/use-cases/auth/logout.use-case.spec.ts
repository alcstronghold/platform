import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AuthPort } from '../../ports';
import { LogoutUseCase } from './logout.use-case';

describe('LogoutUseCase', () => {
  let useCase: LogoutUseCase;
  let mockAuthPort: AuthPort;

  beforeEach(() => {
    mockAuthPort = {
      login: vi.fn(),
      logout: vi.fn(),
      refreshToken: vi.fn(),
      getCurrentUser: vi.fn(),
    };
    useCase = new LogoutUseCase(mockAuthPort);
  });

  it('should call authPort.logout', async () => {
    vi.mocked(mockAuthPort.logout).mockResolvedValue();

    await useCase.execute();

    expect(mockAuthPort.logout).toHaveBeenCalledOnce();
  });

  it('should propagate errors from authPort', async () => {
    vi.mocked(mockAuthPort.logout).mockRejectedValue(new Error('Network error'));

    await expect(useCase.execute()).rejects.toThrow('Network error');
  });

  it('should not call other auth methods', async () => {
    vi.mocked(mockAuthPort.logout).mockResolvedValue();

    await useCase.execute();

    expect(mockAuthPort.login).not.toHaveBeenCalled();
    expect(mockAuthPort.refreshToken).not.toHaveBeenCalled();
    expect(mockAuthPort.getCurrentUser).not.toHaveBeenCalled();
  });
});
