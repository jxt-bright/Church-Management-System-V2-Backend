import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Group } from "../../models/groups_model.js";
import { 
    registerGroup, 
    getGroups, 
    getGroupById, 
    updateGroup, 
    deleteGroup 
} from '../../controllers/groups_controller.js';


// Mock the Group Model
vi.mock('../../models/groups_model.js');



describe('Groups Controller', () => {
  let req, res;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock req and res
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



  // Register group endpoint tests
  describe('registerGroup', () => {
    beforeEach(() => {
        req.body = { name: 'Ashanti Region Group', description: 'Main branch' };
    });


    it('should create a new group if name is unique', async () => {
      Group.findOne.mockResolvedValue(null);
      Group.create.mockResolvedValue({ _id: 'new-id', ...req.body });

      await registerGroup(req, res);

      expect(Group.findOne).toHaveBeenCalledWith({ name: 'Ashanti Region Group' });
      expect(Group.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: "Group successfully registered."
      }));
    });


    it('should return 400 if a group with the same name exists', async () => {
      Group.findOne.mockResolvedValue({ _id: 'existing-id', name: 'Ashanti Region Group' });

      await registerGroup(req, res);

      expect(Group.create).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ 
        message: "A Group with same name already exists" 
      });
    });


    it('should return 500 if the database throws an error', async () => {
      Group.findOne.mockRejectedValue(new Error('DB Error'));
      await registerGroup(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });



  // Tests for getGroups endpoint
  describe('getGroups', () => {
    it('should return paginated groups and metadata', async () => {
      req.query = { page: '1', limit: '10' };

      // The controller expects: [{ metadata: [{ total: X }], data: [...] }]
      const mockResult = [{
          metadata: [{ total: 5 }],
          data: [{ name: 'Ashanti Group' }, { name: 'Central Group' }]
      }];

      Group.aggregate.mockResolvedValue(mockResult);

      await getGroups(req, res);

      expect(Group.aggregate).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
          groups: mockResult[0].data,
          totalPages: 1, // 5 items / 10 limit = 1 page
          totalGroups: 5
      });
    });


    it('should handle search queries', async () => {
      req.query.search = 'Ashanti';
      // Mock empty result
      Group.aggregate.mockResolvedValue([{ metadata: [{ total: 0 }], data: [] }]);

      await getGroups(req, res);

      // Check if regex was passed to match stage
      const aggregateArgs = Group.aggregate.mock.calls[0][0];
      expect(aggregateArgs[0].$match.$or[0].name.$regex).toBe('^Ashanti');
    });

    it('should return 500 if aggregation fails', async () => {
        Group.aggregate.mockRejectedValue(new Error('DB Error'));
        await getGroups(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
    });
  });



  // Tests for getGroupById endpoint
  describe('getGroupById', () => {
      it('should return group data if found', async () => {
          req.params.id = 'group123';
          const mockGroup = { _id: 'group123', name: 'Test Group' };
          Group.findById.mockResolvedValue(mockGroup);

          await getGroupById(req, res);

          expect(Group.findById).toHaveBeenCalledWith('group123');
          expect(res.status).toHaveBeenCalledWith(200);
          expect(res.json).toHaveBeenCalledWith(mockGroup);
      });


      it('should return 404 if group not found', async () => {
          req.params.id = 'group123';
          Group.findById.mockResolvedValue(null);

          await getGroupById(req, res);

          expect(res.status).toHaveBeenCalledWith(404);
          expect(res.json).toHaveBeenCalledWith({ message: 'Group not found' });
      });


      it('should return 500 on server error', async () => {
          Group.findById.mockRejectedValue(new Error('DB Fail'));
          await getGroupById(req, res);
          expect(res.status).toHaveBeenCalledWith(500);
      });
  });



  // Tests for updateGroup endpoint
  describe('updateGroup', () => {
      beforeEach(() => {
          req.params.id = 'group123';
          req.body = { name: 'Updated Name' };
      });


      it('should update group and return 200', async () => {
          Group.findByIdAndUpdate.mockResolvedValue({});

          await updateGroup(req, res);

          expect(Group.findByIdAndUpdate).toHaveBeenCalledWith(
              'group123', 
              req.body, 
              { new: false, runValidators: true }
          );
          expect(res.status).toHaveBeenCalledWith(200);
          expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Group updated successfully' }));
      });


      it('should return 400 if duplicate name (Error 11000)', async () => {
          const error = new Error('Duplicate');
          error.code = 11000;
          Group.findByIdAndUpdate.mockRejectedValue(error);

          await updateGroup(req, res);

          expect(res.status).toHaveBeenCalledWith(400);
          expect(res.json).toHaveBeenCalledWith({ message: 'Group name already exists' });
      });


      it('should return 500 on generic error', async () => {
          Group.findByIdAndUpdate.mockRejectedValue(new Error('Fail'));
          await updateGroup(req, res);
          expect(res.status).toHaveBeenCalledWith(500);
      });
  });



  // Tests for deleteGroup endpoint
  describe('deleteGroup', () => {
      it('should delete group if found', async () => {
          req.params.id = 'group123';
          
          // Mock deleteOne
          const mockGroupInstance = { 
              _id: 'group123', 
              deleteOne: vi.fn().mockResolvedValue(true) 
          };
          Group.findById.mockResolvedValue(mockGroupInstance);

          await deleteGroup(req, res);

          expect(Group.findById).toHaveBeenCalledWith('group123');
          expect(mockGroupInstance.deleteOne).toHaveBeenCalled();
          expect(res.status).toHaveBeenCalledWith(200);
          expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Group removed successfully' }));
      });


      it('should return 404 if group to delete is not found', async () => {
          Group.findById.mockResolvedValue(null);
          await deleteGroup(req, res);
          expect(res.status).toHaveBeenCalledWith(404);
      });
      

      it('should return 500 if deleteOne fails', async () => {
          const mockGroupInstance = { 
              deleteOne: vi.fn().mockRejectedValue(new Error('Delete Fail')) 
          };
          Group.findById.mockResolvedValue(mockGroupInstance);

          await deleteGroup(req, res);
          expect(res.status).toHaveBeenCalledWith(500);
      });
  });

});