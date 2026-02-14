import { describe, it, expect, vi, beforeEach } from 'vitest';
import { monthlyReport, generalReport } from '../../services/reports.service.js';
import { Attendance } from '../../models/attendance_model.js';
import { SpecialService } from '../../models/specialService_model.js';
import { Group } from '../../models/groups_model.js';
import { Church } from '../../models/churches_model.js';
import * as dateUtils from '../../utils/date.utils.js';

// Mock the models
vi.mock('../../models/attendance_model.js', () => ({
  Attendance: { find: vi.fn() }
}));
vi.mock('../../models/specialService_model.js', () => ({
  SpecialService: { find: vi.fn() }
}));
vi.mock('../../models/groups_model.js', () => ({
  Group: { findById: vi.fn() }
}));
vi.mock('../../models/churches_model.js', () => ({
  Church: { findById: vi.fn() }
}));
vi.mock('../../utils/date.utils.js', () => ({
  getMonthDateRange: vi.fn(() => ({ startDate: new Date('2024-01-01'), endDate: new Date('2024-01-31') }))
}));

describe('Report Services', () => {
  const mockGroupId = '607f1f77bcf86cd799439000';
  const mockChurchId = '507f1f77bcf86cd799439011';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Identity Resolution (Meta Data)', () => {
    it('should include meta data when searching by groupId', async () => {
      const mockParams = { month: '2024-01', groupId: mockGroupId };
      
      Group.findById.mockReturnValue({
        lean: () => Promise.resolve({ name: 'Test Group' })
      });
      Attendance.find.mockReturnValue({ lean: () => Promise.resolve([]) });
      SpecialService.find.mockReturnValue({ lean: () => Promise.resolve([]) });

      const report = await monthlyReport(mockParams);

      expect(report.meta.groupName).toBe('Test Group');
      expect(report.meta.churchName).toBeNull();
    });

    it('should include meta data when searching by churchId', async () => {
      const mockParams = { month: '2024-01', churchId: mockChurchId };
      
      Church.findById.mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        lean: () => Promise.resolve({ 
          churchname: 'Test Church', 
          groupId: { name: 'Parent Group' } 
        })
      });
      Attendance.find.mockReturnValue({ lean: () => Promise.resolve([]) });
      SpecialService.find.mockReturnValue({ lean: () => Promise.resolve([]) });

      const report = await generalReport(mockParams);

      expect(report.meta.churchName).toBe('Test Church');
      expect(report.meta.groupName).toBe('Parent Group');
    });
  });

  describe('monthlyReport', () => {
    it('should aggregate regular services and list special services', async () => {
      const mockParams = { month: '2024-01', churchId: mockChurchId };
      
      Church.findById.mockReturnValue({ populate: vi.fn().mockReturnThis(), lean: () => Promise.resolve({ churchname: 'Central Church', groupId: { name: 'Main Group' } }) });
      
      const mockAttendance = [{
        date: '2024-01-07T00:00:00.000Z',
        adultmale: 10, adultfemale: 10,
        youthmale: 5, youthfemale: 5,
        firstoffering: 100, secondoffering: 50
      }];

      Attendance.find.mockReturnValue({ lean: () => Promise.resolve(mockAttendance) });
      SpecialService.find.mockReturnValue({ lean: () => Promise.resolve([]) });

      const report = await monthlyReport(mockParams);

      // Check Metadata
      expect(report.meta.churchName).toBe('Central Church');

      // Check Sunday aggregation
      const sundayEntry = report.sunday.find(s => !s.isMissing);
      expect(sundayEntry.totalAttendance).toBe(30); 
      expect(sundayEntry.offering.total).toBe(150);
    });
  });

  describe('generalReport', () => {
    it('should calculate averages for regular services', async () => {
      const mockParams = { startMonth: '2024-01', endMonth: '2024-02', groupId: mockGroupId };
      
      Group.findById.mockReturnValue({ lean: () => Promise.resolve({ name: 'Regional Group' }) });
      
      const mockAttendance = [
        { date: '2024-01-07', adultmale: 20, adultfemale: 20, reason: null },
        { date: '2024-01-14', adultmale: 40, adultfemale: 40, reason: null }
      ];

      Attendance.find.mockReturnValue({ lean: () => Promise.resolve(mockAttendance) });
      SpecialService.find.mockReturnValue({ lean: () => Promise.resolve([]) });

      const report = await generalReport(mockParams);

      expect(report.meta.groupName).toBe('Regional Group');
      expect(report.sunday.am).toBe(30);
      expect(report.sunday.at).toBe(60);
    });

    it('should calculate averages for GCK special services', async () => {
        const mockParams = { startMonth: '2024-01', endMonth: '2024-01', churchId: mockChurchId };
        
        Church.findById.mockReturnValue({ populate: vi.fn().mockReturnThis(), lean: () => Promise.resolve({ churchname: 'A', groupId: { name: 'B' } }) });

        const mockSpecial = [
            { category: 'GCK', adults: 100, youths: 50, children: 50 },
            { category: 'GCK', adults: 200, youths: 100, children: 100 }
        ];

        Attendance.find.mockReturnValue({ lean: () => Promise.resolve([]) });
        SpecialService.find.mockReturnValue({ lean: () => Promise.resolve(mockSpecial) });

        const report = await generalReport(mockParams);

        expect(report.gck.a).toBe(150);
        expect(report.gck.t).toBe(300);
    });
  });
});