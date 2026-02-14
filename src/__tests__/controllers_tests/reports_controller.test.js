import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as reportsController from '../../controllers/reports_controller.js'; // Adjust path
import * as reportsService from '../../services/reports.service.js';

// Mock the service module
vi.mock('../../services/reports.service.js', () => ({
  monthlyReport: vi.fn(),
  generalReport: vi.fn(),
}));

describe('Reports Controller', () => {
  let req, res;

  beforeEach(() => {
    // Mock req and res objects
    req = {
      query: {}
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    vi.clearAllMocks();
  });

  describe('monthlyReport', () => {
    it('should return 200 and the report data on success', async () => {
      const mockData = { sunday: [], gck: [] };
      req.query = { month: '2024-01', churchId: '123' };
      
      // Mock service resolution
      reportsService.monthlyReport.mockResolvedValue(mockData);

      await reportsController.monthlyReport(req, res);

      expect(reportsService.monthlyReport).toHaveBeenCalledWith(req.query);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        messsage: 'Report successfully generated',
        report: mockData,
      });
    });

    it('should return 500 if the service throws an error', async () => {
      reportsService.monthlyReport.mockRejectedValue(new Error('DB Fail'));

      await reportsController.monthlyReport(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Server Error' });
    });
  });

  describe('generalReport', () => {
    it('should return 200 and general report data on success', async () => {
      const mockData = { averages: { sunday: {} } };
      req.query = { startMonth: '2024-01', endMonth: '2024-03' };
      
      reportsService.generalReport.mockResolvedValue(mockData);

      await reportsController.generalReport(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        report: mockData
      }));
    });

    it('should handle service errors gracefully', async () => {
      reportsService.generalReport.mockRejectedValue(new Error('Timeout'));

      await reportsController.generalReport(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});