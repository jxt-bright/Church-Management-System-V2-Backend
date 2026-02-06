import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as specialServiceService from '../../services/specialService.service.js';
import { SpecialService } from "../../models/specialService_model.js";
import { Church } from "../../models/churches_model.js";

vi.mock("../../models/specialService_model.js");
vi.mock("../../models/churches_model.js");

describe('Special Service Service', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('saveSpecialService', () => {
    it('should throw error if duplicate entry exists', async () => {
      SpecialService.findOne.mockResolvedValue({ _id: '1' });
      
      await expect(specialServiceService.saveSpecialService({ category: 'Revival' }))
        .rejects.toThrow(/Duplicate entry/);
    });

    it('should assign groupId from church record', async () => {
      SpecialService.findOne.mockResolvedValue(null);
      Church.findById.mockReturnValue({
        select: vi.fn().mockResolvedValue({ groupId: 'group_7' })
      });
      // Mock the constructor behavior
      SpecialService.prototype.save = vi.fn().mockResolvedValue({ _id: 'new' });

      await specialServiceService.saveSpecialService({ churchId: 'c1' });
      
      expect(Church.findById).toHaveBeenCalledWith('c1');
    });
  });


  describe('getSpecialService (Role-Based Logic)', () => {
    it('should throw error if category or month is missing', async () => {
      await expect(specialServiceService.getSpecialService({}, 'manager'))
        .rejects.toMatchObject({ status: 400 });
    });

    it('should throw error if a regular user provides no churchId', async () => {
      const query = { category: 'Midweek', month: '2024-02' };
      await expect(specialServiceService.getSpecialService(query, 'user'))
        .rejects.toMatchObject({ message: expect.stringContaining("Church identifier is required") });
    });

    it('should correctly calculate date range for the month query', async () => {
      const query = { category: 'Midweek', month: '2024-02', churchId: 'c1' };
      SpecialService.countDocuments.mockResolvedValue(0);
      SpecialService.find.mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue([])
      });

      await specialServiceService.getSpecialService(query, 'manager');

      const findCall = SpecialService.find.mock.calls[0][0];
      expect(findCall.date.$gte).toEqual(new Date('2024-02-01'));
      expect(findCall.date.$lt).toEqual(new Date('2024-03-01'));
    });
  });


  
  describe('updateSpecialService', () => {
    it('should throw 404 if record does not exist', async () => {
      SpecialService.findById.mockResolvedValue(null);
      await expect(specialServiceService.updateSpecialService('id', {}))
        .rejects.toMatchObject({ status: 404 });
    });

    it('should check for duplicates before updating', async () => {
      SpecialService.findById.mockResolvedValue({ _id: 'id1', category: 'Old' });
      SpecialService.findOne.mockResolvedValue({ _id: 'id2' }); // Found a different record

      await expect(specialServiceService.updateSpecialService('id1', { category: 'New' }))
        .rejects.toMatchObject({ status: 400 });
    });
  });
});