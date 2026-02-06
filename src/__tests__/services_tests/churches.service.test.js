import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { Church } from '../../models/churches_model.js';

import {
  createChurch,
  fetchAllChurches,
  fetchChurchById,
  modifyChurch,
  removeChurch
} from '../../services/churches.service.js';


vi.mock('../../models/churches_model.js');


describe('Church Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });


  describe('createChurch', () => {
    it('should create church if none exists', async () => {
      Church.findOne.mockResolvedValue(null);
      Church.create.mockResolvedValue({});

      await createChurch({ name: 'Grace', groupId: '1' });

      expect(Church.create).toHaveBeenCalled();
    });

    it('should throw if church exists', async () => {
      Church.findOne.mockResolvedValue({});

      await expect(
        createChurch({ name: 'Grace', groupId: '1' })
      ).rejects.toThrow('A Church with same name in the Group already exists');
    });
  });



  describe('fetchChurchById', () => {
    it('should return church if found', async () => {
      Church.findById.mockResolvedValue({ name: 'Church' });

      const result = await fetchChurchById('1');

      expect(result.name).toBe('Church');
    });

    it('should throw if not found', async () => {
      Church.findById.mockResolvedValue(null);

      await expect(fetchChurchById('1'))
        .rejects.toThrow('Church not found');
    });
  });



  describe('modifyChurch', () => {
    it('should update church', async () => {
      Church.findByIdAndUpdate.mockResolvedValue({});

      await modifyChurch('1', { name: 'New' });

      expect(Church.findByIdAndUpdate).toHaveBeenCalled();
    });

    it('should throw duplicate error', async () => {
      const err = new Error();
      err.code = 11000;
      Church.findByIdAndUpdate.mockRejectedValue(err);

      await expect(modifyChurch('1', {}))
        .rejects.toThrow('A church with this name already exists');
    });
  });



  describe('removeChurch', () => {
    it('should delete church', async () => {
      const mockChurch = { deleteOne: vi.fn() };
      Church.findById.mockResolvedValue(mockChurch);

      await removeChurch('1');

      expect(mockChurch.deleteOne).toHaveBeenCalled();
    });

    it('should throw if not found', async () => {
      Church.findById.mockResolvedValue(null);

      await expect(removeChurch('1'))
        .rejects.toThrow('Church not found');
    });
  });
});
