import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as churchService from '../../services/churches.service.js';
import {
  registerChurch,
  getChurches,
  getChurchById,
  updateChurch,
  deleteChurch
} from '../../controllers/churches_controller.js';

vi.mock('../../services/churches.service.js');



describe('Churches Controller', () => {
  let req, res;

  beforeEach(() => {
    vi.clearAllMocks();

    req = {
      body: {},
      params: {},
      query: {},
      user: { status: 'manager', groupId: 'group1' }
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
  });



  describe('registerChurch', () => {
    it('should return 201 and success message when church is created', async () => {
      req.body = { name: 'Central Tabernacle' };
      churchService.createChurch.mockResolvedValue();

      await registerChurch(req, res);

      expect(churchService.createChurch).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Church successfully registered",
      });
    });

    it('should return 400 for duplicate church name in group', async () => {
      const errorMsg = 'A Church with same name in the Group already exists';
      churchService.createChurch.mockRejectedValue(new Error(errorMsg));

      await registerChurch(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: errorMsg });
    });
  });



  describe('getChurches', () => {
    it('should return 200 and the list of churches', async () => {
      const mockResult = { churches: [{ name: 'Church A' }], totalPages: 1 };
      req.query = { page: 1 };
      churchService.fetchAllChurches.mockResolvedValue(mockResult);

      await getChurches(req, res);

      expect(churchService.fetchAllChurches).toHaveBeenCalledWith(req.query, req.user);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });
  });



  describe('getChurchById', () => {
    it('should return 200 and church details if found', async () => {
      const mockChurch = { _id: '123', name: 'Test Church' };
      req.params.id = '123';
      churchService.fetchChurchById.mockResolvedValue(mockChurch);

      await getChurchById(req, res);

      expect(churchService.fetchChurchById).toHaveBeenCalledWith('123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockChurch);
    });

    it('should return 404 if church does not exist', async () => {
      churchService.fetchChurchById.mockRejectedValue(new Error('Church not found'));
      await getChurchById(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });



  describe('updateChurch', () => {
    it('should return 200 on successful update', async () => {
      req.params.id = '123';
      req.body = { name: 'Updated Name' };
      churchService.modifyChurch.mockResolvedValue();

      await updateChurch(req, res);

      expect(churchService.modifyChurch).toHaveBeenCalledWith('123', req.body);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Church updated successfully' });
    });
  });


  
  describe('deleteChurch', () => {
    it('should return 200 and the deleted ID', async () => {
      req.params.id = '123';
      churchService.removeChurch.mockResolvedValue('123');

      await deleteChurch(req, res);

      expect(churchService.removeChurch).toHaveBeenCalledWith('123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ id: '123', message: 'Church removed successfully' });
    });

    it('should return 404 if church to delete is not found', async () => {
      churchService.removeChurch.mockRejectedValue(new Error('Church not found'));
      await deleteChurch(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});