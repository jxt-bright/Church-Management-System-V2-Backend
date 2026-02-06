import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createAttendanceRecord,
  fetchMonthlyAttendance,
  modifyAttendanceRecord,
  removeAttendanceRecord
} from '../../services/attendance.service.js';

import { Attendance } from '../../models/attendance_model.js';
import { Church } from '../../models/churches_model.js';

vi.mock('../../models/attendance_model.js');
vi.mock('../../models/churches_model.js');



describe('Attendance Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });


  describe('createAttendanceRecord', () => {
    it('throws error if duplicate exists', async () => {
      Attendance.findOne.mockResolvedValue({});

      await expect(
        createAttendanceRecord({ date: '2024-01-01', churchId: '1' })
      ).rejects.toThrow();
    });

    it('creates attendance successfully', async () => {
      Attendance.findOne.mockResolvedValue(null);
      Church.findById.mockReturnValue({
        select: vi.fn().mockResolvedValue({ groupId: 'group1' })
      });
      Attendance.create.mockResolvedValue({});

      await createAttendanceRecord({ date: '2024-01-01', churchId: '1' });

      expect(Attendance.create).toHaveBeenCalled();
    });
  });


  describe('fetchMonthlyAttendance', () => {
    it('returns records sorted by date', async () => {
      Attendance.find.mockReturnValue({
        sort: vi.fn().mockResolvedValue([])
      });

      const result = await fetchMonthlyAttendance('1', '2024', '10');

      expect(result).toEqual([]);
    });
  });


  describe('modifyAttendanceRecord', () => {
    it('nullifies fields when reason is provided', async () => {
      Attendance.findByIdAndUpdate.mockResolvedValue({});

      await modifyAttendanceRecord('1', { reason: 'No service' });

      expect(Attendance.findByIdAndUpdate).toHaveBeenCalled();
    });

    it('throws error if record not found', async () => {
      Attendance.findByIdAndUpdate.mockResolvedValue(null);

      await expect(
        modifyAttendanceRecord('1', {})
      ).rejects.toThrow('Attendance record not found');
    });
  });


  describe('removeAttendanceRecord', () => {
    it('deletes record successfully', async () => {
      const mockDoc = { deleteOne: vi.fn() };
      Attendance.findById.mockResolvedValue(mockDoc);

      await removeAttendanceRecord('1');

      expect(mockDoc.deleteOne).toHaveBeenCalled();
    });

    it('throws error if record missing', async () => {
      Attendance.findById.mockResolvedValue(null);

      await expect(removeAttendanceRecord('1')).rejects.toThrow();
    });
  });
});
