import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dashboardStats } from '../../controllers/dashboard_controller.js';
import { getDashboardStats } from '../../services/dashboard.service.js';

// Mock the service module
vi.mock('../../services/dashboard.service.js', () => ({
  getDashboardStats: vi.fn(),
}));

describe('dashboardStats Controller', () => {
  let req, res;

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();

    // Mock req and res objects
    req = {
      query: {
        status: 'churchAdmin',
        target: 'church',
        id: '65d1234567890abcdef12345'
      }
    };

    res = {
      status: vi.fn().mockReturnThis(), // Allows chaining: res.status().json()
      json: vi.fn().mockReturnThis(),
    };
  });

  it('should return 200 and dashboard data on success', async () => {
    const mockData = {
      stats: { totalMembers: 100 },
      attendance: [],
      demographics: []
    };

    // Tell the mocked service what to return
    getDashboardStats.mockResolvedValue(mockData);

    await dashboardStats(req, res);

    // Verify service was called with the query params
    expect(getDashboardStats).toHaveBeenCalledWith(req.query);

    // Verify status code 200
    expect(res.status).toHaveBeenCalledWith(200);

    // Verify JSON response structure
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: mockData
    });
  });

  it('should return 500 when the service throws an error', async () => {
    // Force the service to throw an error
    getDashboardStats.mockRejectedValue(new Error('Database Timeout'));

    await dashboardStats(req, res);

    // Verify status code 500
    expect(res.status).toHaveBeenCalledWith(500);

    // Verify error JSON response
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Failed to retrieve dashboard data'
    });
  });
});