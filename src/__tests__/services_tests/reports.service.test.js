import { describe, it, expect, vi, beforeEach } from 'vitest';
import { monthlyReport, generalReport } from '../../services/reports.service.js';
import { Attendance } from '../../models/attendance_model.js';
import { SpecialService } from '../../models/specialService_model.js';
import * as dateUtils from '../../utils/date.utils.js';

// Mock the models
vi.mock('../../models/attendance_model.js', () => ({
  Attendance: { find: vi.fn() }
}));
vi.mock('../../models/specialService_model.js', () => ({
  SpecialService: { find: vi.fn() }
}));
vi.mock('../../utils/date.utils.js', () => ({
  getMonthDateRange: vi.fn(() => ({ startDate: new Date('2024-01-01'), endDate: new Date('2024-01-31') }))
}));

describe('Report Services', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('monthlyReport', () => {
    it('should aggregate regular services and list special services', async () => {
      const mockParams = { month: '2024-01', churchId: '507f1f77bcf86cd799439011' };
      
      // Mock Attendance data
      const mockAttendance = [{
        date: '2024-01-07T00:00:00.000Z',
        adultmale: 10, adultfemale: 10,
        youthmale: 5, youthfemale: 5,
        firstoffering: 100, secondoffering: 50
      }];

      // Mock Special Service data
      const mockSpecial = [{
        category: 'Seminar',
        date: '2024-01-15',
        adults: 20, youths: 10, children: 5,
        churchName: 'Central Church'
      }];

      Attendance.find.mockReturnValue({ lean: () => Promise.resolve(mockAttendance) });
      SpecialService.find.mockReturnValue({ lean: () => Promise.resolve(mockSpecial) });

      const report = await monthlyReport(mockParams);

      // Check Sunday aggregation (Jan 7, 2024 was a Sunday)
      const sundayEntry = report.sunday.find(s => !s.isMissing);
      expect(sundayEntry.totalAttendance).toBe(30); // 10+10+5+5
      expect(sundayEntry.offering.total).toBe(150);
      
      // Check Seminar listing
      expect(report.seminar).toHaveLength(1);
      expect(report.seminar[0].churchName).toBe('Central Church');
    });
  });

  describe('generalReport', () => {
    it('should calculate averages for regular services', async () => {
      const mockParams = { startMonth: '2024-01', endMonth: '2024-02', groupId: '507f1f77bcf86cd799439011' };
      
      // Two Sundays with different attendance
      const mockAttendance = [
        { date: '2024-01-07', adultmale: 20, adultfemale: 20, reason: null },
        { date: '2024-01-14', adultmale: 40, adultfemale: 40, reason: null }
      ];

      Attendance.find.mockReturnValue({ lean: () => Promise.resolve(mockAttendance) });
      SpecialService.find.mockReturnValue({ lean: () => Promise.resolve([]) });

      const report = await generalReport(mockParams);

      // Average: (20+40)/2 = 30 for males, 30 for females. Total Average Adults = 60.
      expect(report.sunday.am).toBe(30);
      expect(report.sunday.af).toBe(30);
      expect(report.sunday.at).toBe(60);
    });

    it('should calculate averages for GCK special services', async () => {
        const mockParams = { startMonth: '2024-01', endMonth: '2024-01', churchId: '507f1f77bcf86cd799439011' };
        
        const mockSpecial = [
            { category: 'GCK', adults: 100, youths: 50, children: 50 },
            { category: 'GCK', adults: 200, youths: 100, children: 100 }
        ];

        Attendance.find.mockReturnValue({ lean: () => Promise.resolve([]) });
        SpecialService.find.mockReturnValue({ lean: () => Promise.resolve(mockSpecial) });

        const report = await generalReport(mockParams);

        // Average Adults: (100+200)/2 = 150
        expect(report.gck.a).toBe(150);
        expect(report.gck.t).toBe(300);
    });
  });
});