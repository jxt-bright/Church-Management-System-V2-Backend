import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as groupService from '../../services/groups.service.js';
import {
  registerGroup,
  getGroups,
  getGroupById,
  updateGroup,
  deleteGroup
} from '../../controllers/groups_controller.js';

// Mock the SERVICE
vi.mock('../../services/groups.service.js');

describe('Groups Controller', () => {
  let req, res;

  beforeEach(() => {
    vi.clearAllMocks();

    req = {
      body: {},
      params: {},
      query: {}
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
  });



  describe('registerGroup', () => {
    it('should return 201 when group is created', async () => {
      req.body = { name: 'Western Region Group' };
      groupService.createGroup.mockResolvedValue();

      await registerGroup(req, res);

      expect(groupService.createGroup).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Group successfully registered.'
      });
    });

    it('should return 400 if group already exists', async () => {
      const errorMsg = 'A Group with same name already exists';
      groupService.createGroup.mockRejectedValue(new Error(errorMsg));

      await registerGroup(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: errorMsg });
    });
  });



  describe('getGroups', () => {
    it('should return groups list and 200 status', async () => {
      const result = { groups: [{ name: 'Group A' }], totalPages: 1, totalGroups: 1 };
      req.query = { page: '1', limit: '10' };
      groupService.fetchAllGroups.mockResolvedValue(result);

      await getGroups(req, res);

      expect(groupService.fetchAllGroups).toHaveBeenCalledWith(req.query);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(result);
    });

    it('should return 500 and the error message on failure', async () => {
      groupService.fetchAllGroups.mockRejectedValue(new Error('Fetch Failed'));

      await getGroups(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Error fetching groups',
        error: 'Fetch Failed'
      }));
    });
  });



  describe('getGroupById', () => {
    it('should return 200 and group details if found', async () => {
      const group = { _id: 'g123', name: 'Ashanti Group' };
      req.params.id = 'g123';
      groupService.fetchGroupById.mockResolvedValue(group);

      await getGroupById(req, res);

      expect(groupService.fetchGroupById).toHaveBeenCalledWith('g123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(group);
    });

    it('should return 404 if group is not found', async () => {
      groupService.fetchGroupById.mockRejectedValue(new Error('Group not found'));
      await getGroupById(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });



  describe('updateGroup', () => {
    it('should call modifyGroup with correct ID and body', async () => {
      req.params.id = 'g123';
      req.body = { name: 'New Ashanti Name' };
      groupService.modifyGroup.mockResolvedValue();

      await updateGroup(req, res);

      expect(groupService.modifyGroup).toHaveBeenCalledWith('g123', req.body);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Group updated successfully' });
    });

    it('should return 400 on duplicate name error', async () => {
      groupService.modifyGroup.mockRejectedValue(new Error('Group name already exists'));
      await updateGroup(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });


  
  describe('deleteGroup', () => {
    it('should return 200 and the deleted ID on success', async () => {
      req.params.id = 'g123';
      groupService.removeGroup.mockResolvedValue('g123');

      await deleteGroup(req, res);

      expect(groupService.removeGroup).toHaveBeenCalledWith('g123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ 
        id: 'g123', 
        message: 'Group removed successfully' 
      });
    });

    it('should return 404 if the group to delete does not exist', async () => {
      groupService.removeGroup.mockRejectedValue(new Error('Group not found'));
      await deleteGroup(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});