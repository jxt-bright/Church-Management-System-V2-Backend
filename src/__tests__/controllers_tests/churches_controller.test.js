import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Church } from "../../models/churches_model.js";
import mongoose from 'mongoose';

import {
  registerChurch,
  getChurches,
  getChurchById,
  updateChurch,
  deleteChurch
} from '../../controllers/churches_controller.js';


// Mock churches_model(churches schema)
vi.mock('../../models/churches_model.js');



describe('Churches Controller', () => {
  let req, res;

  // Setup before every single test
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock 'req'
    req = {
      body: {},
      params: {},
      query: {},
      user: { status: 'manager', groupId: 'group_id_1' } // Default user
    };

    // Mock 'res'
    res = {
      status: vi.fn().mockReturnThis(), // Allow chaining .status().json()
      json: vi.fn()
    };
  });



  // Register a Church endpoint tests
  describe('registerChurch', () => {
    beforeEach(() => {
      req.body = { name: 'Grace Baptist', groupId: 'group123' };
    });


    it('should return 201 and create church if it does not exist', async () => {
      // Arrange
      Church.findOne.mockResolvedValue(null);
      Church.create.mockResolvedValue(req.body);

      // Act
      await registerChurch(req, res);

      // Assert
      expect(Church.findOne).toHaveBeenCalledWith({ groupId: 'group123', name: 'Grace Baptist' });
      expect(Church.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, message: "Church successfully registered" }));
    });


    it('should return 400 if church name already exists in group', async () => {
      // Arrange
      // Found an existing Church with same name and groupId
      Church.findOne.mockResolvedValue({ name: 'Grace Baptist', groupId: 'group123' });

      // Act
      await registerChurch(req, res);

      expect(Church.create).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: "A Church with same name in the Group already exists"
      }));
    });


    it('should return 500 on server error', async () => {
      // Arrange
      Church.findOne.mockRejectedValue(new Error('DB Error'));

      // Act
      await registerChurch(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Internal server error" }));
    });
  });



  // Fetch all churches endpoint tests
  describe('getChurches', () => {
    it('should return paginated data for a manager', async () => {
      // Arrange
      req.user.status = 'manager';
      req.query = { page: '1', limit: '10' };

      // Mock the specific structure returned by Aggregate
      const mockAggregateResult = [{
        metadata: [{ total: 20 }],
        data: [{ name: 'Church A' }, { name: 'Church B' }]
      }];
      Church.aggregate.mockResolvedValue(mockAggregateResult);

      // Act
      await getChurches(req, res);

      // Assert
      expect(Church.aggregate).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        churches: mockAggregateResult[0].data,
        totalPages: 2, // 20 docs / 10 limit = 2 pages
        totalChurches: 20
      });
    });


    it('should filter by groupId if user is NOT a manager', async () => {
      // Arrange
      const validGroupId = new mongoose.Types.ObjectId();
      req.user = { status: 'user', groupId: validGroupId.toString() };

      // Mock empty result for simplicity
      Church.aggregate.mockResolvedValue([{ metadata: [], data: [] }]);

      // Act
      await getChurches(req, res);

      // Inspect the arguments passed to aggregate to ensure groupId was used
      const aggregateCallArgs = Church.aggregate.mock.calls[0][0];
      const matchStage = aggregateCallArgs[0].$match;

      // Assert
      // Check if the match stage includes the user's groupId
      expect(matchStage.groupId.toString()).toBe(validGroupId.toString());
    });


    it('should return empty list if user has invalid groupId', async () => {
      // Arrange
      req.user = { status: 'user', groupId: 'INVALID_ID' };

      // Act
      await getChurches(req, res);

      // Assert
      expect(Church.aggregate).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ churches: [], totalPages: 0, totalChurches: 0 });
    });


    it('should handle search query', async () => {
      req.query.search = 'Grace';
      Church.aggregate.mockResolvedValue([{ metadata: [], data: [] }]);

      await getChurches(req, res);

      const aggregateCallArgs = Church.aggregate.mock.calls[0][0];
      const matchStage = aggregateCallArgs[0].$match;

      expect(matchStage.$or).toBeDefined();
      expect(matchStage.$or[0].name.$regex).toBe('^Grace');
    });


    it('should return 500 if aggregation fails', async () => {
      Church.aggregate.mockRejectedValue(new Error('Agg fail'));
      await getChurches(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });


// Fetch a particular church endpoint tests
  describe('getChurchById', () => {
    it('should return church data if found', async () => {
      req.params.id = 'church_1';
      const mockChurch = { _id: 'church_1', name: 'Test Church' };
      Church.findById.mockResolvedValue(mockChurch);

      await getChurchById(req, res);

      expect(Church.findById).toHaveBeenCalledWith('church_1');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockChurch);
    });


    it('should return 404 if church not found', async () => {
      req.params.id = 'church_1';
      Church.findById.mockResolvedValue(null);

      await getChurchById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Church not found' });
    });


    it('should return 500 on server error', async () => {
      Church.findById.mockRejectedValue(new Error('Fail'));
      await getChurchById(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });



  // Update church endpoint tests
  describe('updateChurch', () => {
    beforeEach(() => {
      req.params.id = 'church_1';
      req.body = { name: 'Updated Name' };
    });


    it('should update church and return 200', async () => {
      Church.findByIdAndUpdate.mockResolvedValue({});

      await updateChurch(req, res);

      expect(Church.findByIdAndUpdate).toHaveBeenCalledWith(
        'church_1',
        req.body,
        { new: false, runValidators: true }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Church updated successfully' }));
    });


    it('should return 400 if duplicate name (Error 11000)', async () => {
      // An error object that mimics MongoDB duplicate key error
      const duplicateError = new Error('Duplicate Key');
      duplicateError.code = 11000;

      Church.findByIdAndUpdate.mockRejectedValue(duplicateError);

      await updateChurch(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'A church with this name already exists' });
    });
    

    it('should return 500 on generic error', async () => {
      Church.findByIdAndUpdate.mockRejectedValue(new Error('Generic Error'));
      await updateChurch(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });



  // Delete church endpoint tests
  describe('deleteChurch', () => {
    it('should delete church if found', async () => {
      req.params.id = 'church_1';

      // The controller calls church.deleteOne() So it has to contain that function.
      const mockChurchInstance = {
        _id: 'church_1',
        deleteOne: vi.fn().mockResolvedValue(true)
      };

      Church.findById.mockResolvedValue(mockChurchInstance);

      await deleteChurch(req, res);

      expect(Church.findById).toHaveBeenCalledWith('church_1');
      expect(mockChurchInstance.deleteOne).toHaveBeenCalled(); // Ensure the method was called
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Church removed successfully' }));
    });


    it('should return 404 if church to delete is not found', async () => {
      Church.findById.mockResolvedValue(null);

      await deleteChurch(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Church not found' });
    });


    it('should return 500 if delete fails', async () => {
      const mockChurchInstance = {
        deleteOne: vi.fn().mockRejectedValue(new Error('Delete failed'))
      };
      Church.findById.mockResolvedValue(mockChurchInstance);

      await deleteChurch(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

});