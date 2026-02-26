import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { getDashboardStats } from '../../services/dashboard.service.js';
import { Member } from '../../models/members_model.js';
import { Church } from '../../models/churches_model.js';
import { Group } from '../../models/groups_model.js';
import { User } from '../../models/users_model.js';
import { Attendance } from '../../models/attendance_model.js';

// Mock all Mongoose models
vi.mock('../../models/members_model.js', () => ({ Member: { countDocuments: vi.fn() } }));
vi.mock('../../models/churches_model.js', () => ({ Church: { countDocuments: vi.fn() } }));
vi.mock('../../models/groups_model.js', () => ({ Group: { countDocuments: vi.fn() } }));
vi.mock('../../models/users_model.js', () => ({ User: { countDocuments: vi.fn() } }));
vi.mock('../../models/attendance_model.js', () => ({ Attendance: { aggregate: vi.fn() } }));

describe('getDashboardStats Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return global stats for a manager', async () => {
    const query = { status: 'manager' };

    // Mock KPI counts
    Group.countDocuments.mockResolvedValue(10);
    Church.countDocuments.mockResolvedValue(50);
    User.countDocuments.mockResolvedValue(100);
    Member.countDocuments.mockResolvedValue(1000); // For totalMembers and demographics

    // Mock empty arrays for charts to simplify
    Attendance.aggregate.mockResolvedValue([]);

    const result = await getDashboardStats(query);

    // Verify Manager specific calls
    expect(Group.countDocuments).toHaveBeenCalled();
    expect(result.stats.totalGroups).toBe(10);
    expect(result.stats.totalChurches).toBe(50);
    
    // Verify filter was empty for manager
    expect(Member.countDocuments).toHaveBeenCalledWith({});
  });

  it('should apply church filter and run aggregation for churchAdmin', async () => {
    const churchId = new mongoose.Types.ObjectId().toString();
    const query = { 
      status: 'churchAdmin', 
      target: 'church', 
      id: churchId 
    };

    // Mock KPI counts
    Member.countDocuments.mockResolvedValue(200);
    
    // Mock Aggregation result for Newcomers and Offerings
    const mockMonthlyAgg = [{ totalNewcomers: 15, totalOffering: 5000 }];
    const mockTrendAgg = [{ month: 'Feb', Adults: 100, Youths: 50, Children: 20 }];
    
    Attendance.aggregate
      .mockResolvedValueOnce(mockMonthlyAgg) // first call (KPIs)
      .mockResolvedValueOnce(mockTrendAgg)    // second call (Attendance Trend)
      .mockResolvedValueOnce([]);             // third call (Offerings Trend)

    const result = await getDashboardStats(query);

    // Verify correct KPI mapping
    expect(result.stats.newComers).toBe(15);
    expect(result.stats.monthlyOffering).toBe(5000);
    expect(result.stats.totalMembers).toBe(200);

    // Verify aggregation was called with an ObjectId
    const aggCall = Attendance.aggregate.mock.calls[0][0];
    const matchStage = aggCall.find(stage => stage.$match);
    expect(matchStage.$match.churchId).toBeInstanceOf(mongoose.Types.ObjectId);
    expect(matchStage.$match.churchId.toString()).toBe(churchId);
  });

  it('should calculate totalWorkers correctly', async () => {
    const query = { status: 'groupAdmin', target: 'group', id: new mongoose.Types.ObjectId().toString() };
    
    Member.countDocuments.mockImplementation((filter) => {
      if (filter.memberStatus === 'Worker') return 50;
      return 500;
    });
    Attendance.aggregate.mockResolvedValue([]);

    const result = await getDashboardStats(query);

    expect(result.stats.totalWorkers).toBe(50);
    expect(Member.countDocuments).toHaveBeenCalledWith(expect.objectContaining({ 
        memberStatus: 'Worker' 
    }));
  });
});