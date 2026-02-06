import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Group } from '../../models/groups_model.js';

import {
  createGroup,
  fetchAllGroups,
  fetchGroupById,
  modifyGroup,
  removeGroup
} from '../../services/groups.service.js';


vi.mock('../../models/groups_model.js');

describe('Groups Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });


  describe('createGroup', () => {
    it('should create group if name is unique', async () => {
      Group.findOne.mockResolvedValue(null);
      Group.create.mockResolvedValue({});

      await createGroup({ name: 'Ashanti' });

      expect(Group.create).toHaveBeenCalled();
    });

    it('should throw if group exists', async () => {
      Group.findOne.mockResolvedValue({});

      await expect(
        createGroup({ name: 'Ashanti' })
      ).rejects.toThrow('A Group with same name already exists');
    });
  });


  describe('fetchAllGroups', () => {
    it('should return paginated result', async () => {
      Group.aggregate.mockResolvedValue([
        {
          metadata: [{ total: 5 }],
          data: [{ name: 'Group A' }]
        }
      ]);

      const result = await fetchAllGroups({ page: '1', limit: '10' });

      expect(result.totalGroups).toBe(5);
      expect(result.groups.length).toBe(1);
    });
  });


  describe('fetchGroupById', () => {
    it('should return group if found', async () => {
      Group.findById.mockResolvedValue({ name: 'Test' });

      const result = await fetchGroupById('1');

      expect(result.name).toBe('Test');
    });

    it('should throw if not found', async () => {
      Group.findById.mockResolvedValue(null);

      await expect(fetchGroupById('1'))
        .rejects.toThrow('Group not found');
    });
  });


  describe('modifyGroup', () => {
    it('should update group', async () => {
      Group.findByIdAndUpdate.mockResolvedValue({});

      await modifyGroup('1', { name: 'New' });

      expect(Group.findByIdAndUpdate).toHaveBeenCalled();
    });

    it('should throw duplicate error', async () => {
      const err = new Error();
      err.code = 11000;
      Group.findByIdAndUpdate.mockRejectedValue(err);

      await expect(modifyGroup('1', {}))
        .rejects.toThrow('Group name already exists');
    });
  });


  describe('removeGroup', () => {
    it('should delete group', async () => {
      const mockGroup = { deleteOne: vi.fn() };
      Group.findById.mockResolvedValue(mockGroup);

      await removeGroup('1');

      expect(mockGroup.deleteOne).toHaveBeenCalled();
    });

    it('should throw if group not found', async () => {
      Group.findById.mockResolvedValue(null);

      await expect(removeGroup('1'))
        .rejects.toThrow('Group not found');
    });
  });
});