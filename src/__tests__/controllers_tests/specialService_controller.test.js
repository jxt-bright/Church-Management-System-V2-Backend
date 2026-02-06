import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as specialServiceController from '../../controllers/specialService_controller.js';
import * as specialServiceService from '../../services/specialService.service.js';

vi.mock('../../services/specialService.service.js');



describe('Special Service Controller', () => {
  let req, res;

  beforeEach(() => {
    vi.clearAllMocks();
    req = { body: {}, params: {}, query: {}, user: { status: 'Manager' } };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
  });



  describe('saveSpecialService', () => {
    it('should return 201 on successful save', async () => {
      specialServiceService.saveSpecialService.mockResolvedValue({});
      await specialServiceController.saveSpecialService(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should return 400 when service throws a duplicate error', async () => {
      specialServiceService.saveSpecialService.mockRejectedValue(new Error('Duplicate entry'));
      await specialServiceController.saveSpecialService(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });


  
  describe('getSpecialService', () => {
    it('should correctly format and map data for the frontend', async () => {
      const mockServiceData = {
        services: [{
          _id: 's1',
          category: 'Midweek',
          date: '2024-02-05',
          churchId: { name: 'City Church', location: 'Accra' }
        }],
        totalPages: 1,
        totalRecords: 1,
        currentPage: 1
      };
      
      specialServiceService.getSpecialService.mockResolvedValue(mockServiceData);

      await specialServiceController.getSpecialService(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        data: [expect.objectContaining({
          churchName: 'City Church',
          churchLocation: 'Accra'
        })]
      }));
    });

    it('should use default values for missing church data during mapping', async () => {
      const mockData = { services: [{ _id: '1', churchId: null }], totalPages: 1 };
      specialServiceService.getSpecialService.mockResolvedValue(mockData);

      await specialServiceController.getSpecialService(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.data[0].churchName).toBe('Unknown Church');
    });
  });
});