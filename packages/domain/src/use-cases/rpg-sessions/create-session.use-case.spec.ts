import { describe, expect, it, vi } from 'vitest';

import type { CreateRpgSessionData, RpgSessionDetail } from '../../entities/rpg-session.entity.js';
import type { RpgSessionPort } from '../../ports/rpg-session.port.js';
import { CreateSessionUseCase } from './create-session.use-case.js';

function createMockPort(): RpgSessionPort {
  return {
    listSessions: vi.fn(),
    getSession: vi.fn(),
    createSession: vi.fn(),
    updateSession: vi.fn(),
    deleteSession: vi.fn(),
  };
}

const validData: CreateRpgSessionData = {
  title: 'La Maldición de Strahd',
  slogan: 'Aventura gótica',
  synopsis: 'Una aventura en Barovia...',
  rpgFamilyId: 'family-1',
  rpgEditionId: 'edition-1',
  rpgSystemId: 'system-1',
  settingId: 'setting-1',
  ageRangeId: 'age-1',
  knowledgeLevelId: 'kl-1',
  knowledgeLevelOther: null,
  minPlayers: 3,
  maxPlayers: 6,
  minDurationMinutes: 120,
  maxDurationMinutes: 240,
  comments: null,
  genreIds: ['genre-1'],
  accessibilityOptionIds: [],
  languageIds: ['lang-1'],
  contentWarningIds: [],
  safetyMeasureIds: ['sm-1'],
};

const mockDetail: RpgSessionDetail = {
  id: 'session-1',
  title: 'La Maldición de Strahd',
  slogan: 'Aventura gótica',
  status: 'draft',
  masterName: 'Master User',
  masterId: 'master-1',
  rpgSystemName: 'd20 System',
  rpgEditionName: 'D&D 5e',
  settingName: 'Barovia',
  ageRangeName: '+16',
  minPlayers: 3,
  maxPlayers: 6,
  currentPlayers: 0,
  dateCreated: '2026-01-01T00:00:00Z',
  synopsis: 'Una aventura en Barovia...',
  knowledgeLevelId: 'kl-1',
  knowledgeLevelName: 'Familiar',
  knowledgeLevelOther: null,
  minDurationMinutes: 120,
  maxDurationMinutes: 240,
  comments: null,
  rpgFamilyId: 'family-1',
  rpgEditionId: 'edition-1',
  rpgSystemId: 'system-1',
  settingId: 'setting-1',
  ageRangeId: 'age-1',
  genreIds: ['genre-1'],
  accessibilityOptionIds: [],
  languageIds: ['lang-1'],
  contentWarningIds: [],
  safetyMeasureIds: ['sm-1'],
};

describe('CreateSessionUseCase', () => {
  describe('validation', () => {
    it('should reject empty title', async () => {
      const port = createMockPort();
      const useCase = new CreateSessionUseCase(port);

      const result = await useCase.execute('master-1', { ...validData, title: '' });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(port.createSession).not.toHaveBeenCalled();
    });

    it('should reject title with only whitespace', async () => {
      const port = createMockPort();
      const useCase = new CreateSessionUseCase(port);

      const result = await useCase.execute('master-1', { ...validData, title: '   ' });

      expect(result.success).toBe(false);
      expect(port.createSession).not.toHaveBeenCalled();
    });

    it('should reject minPlayers less than 1', async () => {
      const port = createMockPort();
      const useCase = new CreateSessionUseCase(port);

      const result = await useCase.execute('master-1', { ...validData, minPlayers: 0 });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(port.createSession).not.toHaveBeenCalled();
    });

    it('should reject maxPlayers less than minPlayers', async () => {
      const port = createMockPort();
      const useCase = new CreateSessionUseCase(port);

      const result = await useCase.execute('master-1', {
        ...validData,
        minPlayers: 5,
        maxPlayers: 3,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(port.createSession).not.toHaveBeenCalled();
    });

    it('should accept equal minPlayers and maxPlayers', async () => {
      const port = createMockPort();
      vi.mocked(port.createSession).mockResolvedValue(mockDetail);
      const useCase = new CreateSessionUseCase(port);

      const result = await useCase.execute('master-1', {
        ...validData,
        minPlayers: 4,
        maxPlayers: 4,
      });

      expect(result.success).toBe(true);
    });

    it('should reject minDurationMinutes less than 1', async () => {
      const port = createMockPort();
      const useCase = new CreateSessionUseCase(port);

      const result = await useCase.execute('master-1', {
        ...validData,
        minDurationMinutes: 0,
      });

      expect(result.success).toBe(false);
      expect(port.createSession).not.toHaveBeenCalled();
    });

    it('should reject maxDurationMinutes less than minDurationMinutes', async () => {
      const port = createMockPort();
      const useCase = new CreateSessionUseCase(port);

      const result = await useCase.execute('master-1', {
        ...validData,
        minDurationMinutes: 240,
        maxDurationMinutes: 120,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(port.createSession).not.toHaveBeenCalled();
    });

    it('should reject empty ageRangeId', async () => {
      const port = createMockPort();
      const useCase = new CreateSessionUseCase(port);

      const result = await useCase.execute('master-1', { ...validData, ageRangeId: '' });

      expect(result.success).toBe(false);
      expect(port.createSession).not.toHaveBeenCalled();
    });

    it('should reject empty knowledgeLevelId', async () => {
      const port = createMockPort();
      const useCase = new CreateSessionUseCase(port);

      const result = await useCase.execute('master-1', { ...validData, knowledgeLevelId: '' });

      expect(result.success).toBe(false);
      expect(port.createSession).not.toHaveBeenCalled();
    });

    it('should reject empty masterId', async () => {
      const port = createMockPort();
      const useCase = new CreateSessionUseCase(port);

      const result = await useCase.execute('', validData);

      expect(result.success).toBe(false);
      expect(port.createSession).not.toHaveBeenCalled();
    });
  });

  describe('delegation', () => {
    it('should create session with valid data', async () => {
      const port = createMockPort();
      vi.mocked(port.createSession).mockResolvedValue(mockDetail);
      const useCase = new CreateSessionUseCase(port);

      const result = await useCase.execute('master-1', validData);

      expect(result.success).toBe(true);
      expect(result.session).toEqual(mockDetail);
      expect(port.createSession).toHaveBeenCalledWith('master-1', validData);
    });

    it('should trim title before sending to port', async () => {
      const port = createMockPort();
      vi.mocked(port.createSession).mockResolvedValue(mockDetail);
      const useCase = new CreateSessionUseCase(port);

      await useCase.execute('master-1', { ...validData, title: '  La Maldición  ' });

      expect(port.createSession).toHaveBeenCalledWith(
        'master-1',
        expect.objectContaining({ title: 'La Maldición' }),
      );
    });

    it('should return error when port throws', async () => {
      const port = createMockPort();
      vi.mocked(port.createSession).mockRejectedValue(new Error('Directus error'));
      const useCase = new CreateSessionUseCase(port);

      const result = await useCase.execute('master-1', validData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Directus error');
    });
  });
});
