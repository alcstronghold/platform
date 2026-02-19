import type { CatalogPort, RpgEditionCatalog, SettingCatalog } from '@alcstronghold/domain';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CATALOG_PORT } from '../providers/directus.provider';
import { CatalogService } from './catalog.service';

function createMockPort(): CatalogPort {
  return {
    listRpgFamilies: vi.fn().mockResolvedValue([]),
    listRpgEditions: vi.fn().mockResolvedValue([]),
    listRpgSystems: vi.fn().mockResolvedValue([]),
    listSettings: vi.fn().mockResolvedValue([]),
    listGenres: vi.fn().mockResolvedValue([]),
    listAgeRanges: vi.fn().mockResolvedValue([]),
    listKnowledgeLevels: vi.fn().mockResolvedValue([]),
    listAccessibilityOptions: vi.fn().mockResolvedValue([]),
    listSessionLanguages: vi.fn().mockResolvedValue([]),
    listContentWarnings: vi.fn().mockResolvedValue([]),
    listSafetyMeasures: vi.fn().mockResolvedValue([]),
  };
}

describe('CatalogService', () => {
  let service: CatalogService;
  let mockPort: CatalogPort;

  beforeEach(() => {
    mockPort = createMockPort();

    TestBed.configureTestingModule({
      providers: [
        { provide: CATALOG_PORT, useValue: mockPort },
      ],
    });

    service = TestBed.inject(CatalogService);
  });

  describe('loadAll', () => {
    it('should call all catalog methods in parallel', async () => {
      await service.loadAll();

      expect(mockPort.listRpgFamilies).toHaveBeenCalled();
      expect(mockPort.listRpgEditions).toHaveBeenCalled();
      expect(mockPort.listRpgSystems).toHaveBeenCalled();
      expect(mockPort.listSettings).toHaveBeenCalled();
      expect(mockPort.listGenres).toHaveBeenCalled();
      expect(mockPort.listAgeRanges).toHaveBeenCalled();
      expect(mockPort.listKnowledgeLevels).toHaveBeenCalled();
      expect(mockPort.listAccessibilityOptions).toHaveBeenCalled();
      expect(mockPort.listSessionLanguages).toHaveBeenCalled();
      expect(mockPort.listContentWarnings).toHaveBeenCalled();
      expect(mockPort.listSafetyMeasures).toHaveBeenCalled();
    });

    it('should update state after loading', async () => {
      vi.mocked(mockPort.listAgeRanges).mockResolvedValue([
        { id: 'age-1', identifier: '+16', name: '+16 años' },
      ]);

      await service.loadAll();

      expect(service.ageRanges()).toEqual([
        { id: 'age-1', identifier: '+16', name: '+16 años' },
      ]);
      expect(service.isLoading()).toBe(false);
    });

    it('should handle errors', async () => {
      vi.mocked(mockPort.listRpgFamilies).mockRejectedValue(new Error('API error'));

      await service.loadAll();

      expect(service.error()).toBe('API error');
      expect(service.isLoading()).toBe(false);
    });
  });

  describe('editionsByFamily', () => {
    const editions: RpgEditionCatalog[] = [
      { id: 'ed-1', identifier: 'dnd-5e', name: 'D&D 5e', rpgFamilyId: 'fam-1', rpgSystemId: 'sys-1' },
      { id: 'ed-2', identifier: 'pf-2e', name: 'PF 2e', rpgFamilyId: 'fam-2', rpgSystemId: 'sys-2' },
      { id: 'ed-3', identifier: 'dnd-3e', name: 'D&D 3e', rpgFamilyId: 'fam-1', rpgSystemId: 'sys-1' },
    ];

    it('should return all editions when familyId is null', async () => {
      vi.mocked(mockPort.listRpgEditions).mockResolvedValue(editions);
      await service.loadAll();

      expect(service.editionsByFamily(null)).toHaveLength(3);
    });

    it('should filter editions by familyId', async () => {
      vi.mocked(mockPort.listRpgEditions).mockResolvedValue(editions);
      await service.loadAll();

      const result = service.editionsByFamily('fam-1');
      expect(result).toHaveLength(2);
      expect(result.every(e => e.rpgFamilyId === 'fam-1')).toBe(true);
    });
  });

  describe('settingsByFamily', () => {
    const settings: SettingCatalog[] = [
      { id: 'set-1', identifier: 'forgotten-realms', name: 'Forgotten Realms', genreIds: ['g1'], rpgFamilyIds: ['fam-1'] },
      { id: 'set-2', identifier: 'golarion', name: 'Golarion', genreIds: ['g1'], rpgFamilyIds: ['fam-2'] },
    ];

    it('should return all settings when familyId is null', async () => {
      vi.mocked(mockPort.listSettings).mockResolvedValue(settings);
      await service.loadAll();

      expect(service.settingsByFamily(null)).toHaveLength(2);
    });

    it('should filter settings by familyId', async () => {
      vi.mocked(mockPort.listSettings).mockResolvedValue(settings);
      await service.loadAll();

      const result = service.settingsByFamily('fam-1');
      expect(result).toHaveLength(1);
      expect(result[0].identifier).toBe('forgotten-realms');
    });
  });
});
