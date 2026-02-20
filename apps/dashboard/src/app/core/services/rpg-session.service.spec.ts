import type { RpgSessionPort, RpgSessionSummary } from '@alcstronghold/domain';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RPG_SESSION_PORT } from '../providers/directus.provider';
import { RpgSessionService } from './rpg-session.service';

function createMockPort(): RpgSessionPort {
  return {
    listSessions: vi.fn().mockResolvedValue([]),
    getSession: vi.fn().mockResolvedValue(null),
    createSession: vi.fn(),
    updateSession: vi.fn(),
    deleteSession: vi.fn().mockResolvedValue(undefined),
  };
}

const mockSummary: RpgSessionSummary = {
  id: 'session-1',
  title: 'Test Session',
  slogan: null,
  status: 'draft',
  masterName: 'Master User',
  masterId: 'master-1',
  rpgSystemName: null,
  rpgEditionName: null,
  settingName: null,
  ageRangeName: '+16',
  minPlayers: 3,
  maxPlayers: 6,
  currentPlayers: 0,
  dateCreated: '2026-01-01T00:00:00Z',
};

describe('RpgSessionService', () => {
  let service: RpgSessionService;
  let mockPort: RpgSessionPort;

  beforeEach(() => {
    mockPort = createMockPort();

    TestBed.configureTestingModule({
      providers: [
        { provide: RPG_SESSION_PORT, useValue: mockPort },
      ],
    });

    service = TestBed.inject(RpgSessionService);
  });

  describe('loadSessions', () => {
    it('should load sessions and update state', async () => {
      vi.mocked(mockPort.listSessions).mockResolvedValue([mockSummary]);

      await service.loadSessions();

      expect(service.sessions()).toEqual([mockSummary]);
      expect(service.isLoading()).toBe(false);
      expect(service.error()).toBeNull();
    });

    it('should pass filter to port', async () => {
      await service.loadSessions({ masterId: 'master-1' });

      expect(mockPort.listSessions).toHaveBeenCalledWith({ masterId: 'master-1' });
    });

    it('should handle errors', async () => {
      vi.mocked(mockPort.listSessions).mockRejectedValue(new Error('Network error'));

      await service.loadSessions();

      expect(service.error()).toBe('Network error');
      expect(service.isLoading()).toBe(false);
    });
  });

  describe('deleteSession', () => {
    it('should delete and reload sessions', async () => {
      await service.deleteSession('session-1');

      expect(mockPort.deleteSession).toHaveBeenCalledWith('session-1');
      expect(mockPort.listSessions).toHaveBeenCalled();
    });
  });
});
