import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as attendanceController from '../../controllers/attendance_controller.js';
import * as attendanceService from '../../services/attendance.service.js';

// Mock the Service layer
vi.mock('../../services/attendance.service.js');



describe('Attendance Controller', () => {
    let req, res;

    beforeEach(() => {
        // Reset req and res for every test
        req = { body: {}, params: {}, query: {} };
        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        };
        vi.clearAllMocks();
    });



    describe('saveAttendance', () => {
        it('returns 201 and success message on success', async () => {
            req.body = { date: '2024-02-05', churchId: 'church123' };
            attendanceService.createAttendanceRecord.mockResolvedValue({ _id: 'new_id' });

            await attendanceController.saveAttendance(req, res);

            expect(attendanceService.createAttendanceRecord).toHaveBeenCalledWith(req.body);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                message: 'Attendance Record successfully saved'
            }));
        });

        it('returns 400 for duplicate record error', async () => {
            const errorMsg = 'Attendance with this date exist';
            attendanceService.createAttendanceRecord.mockRejectedValue(new Error(errorMsg));

            await attendanceController.saveAttendance(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: errorMsg });
        });

        it('returns 500 for unexpected service errors', async () => {
            attendanceService.createAttendanceRecord.mockRejectedValue(new Error('DB Crash'));
            await attendanceController.saveAttendance(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
        });
    });



    describe('getAttendance', () => {
        it('returns 400 if required query parameters are missing', async () => {
            req.query = { churchId: '1' }; // Missing year and month
            await attendanceController.getAttendance(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ 
                message: expect.stringContaining("Missing required parameters") 
            }));
        });

        it('returns records and 200 on valid search', async () => {
            const mockRecords = [{ _id: '1', date: '2024-01-01' }];
            req.query = { churchId: 'c1', year: '2024', month: '01' };
            attendanceService.fetchMonthlyAttendance.mockResolvedValue(mockRecords);

            await attendanceController.getAttendance(req, res);

            expect(attendanceService.fetchMonthlyAttendance).toHaveBeenCalledWith('c1', '2024', '01');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockRecords);
        });
    });



    describe('updateAttendance', () => {
        it('returns 200 and the updated record on success', async () => {
            req.params.id = 'att123';
            req.body = { adultmale: 50 };
            const mockUpdated = { _id: 'att123', adultmale: 50 };
            attendanceService.modifyAttendanceRecord.mockResolvedValue(mockUpdated);

            await attendanceController.updateAttendance(req, res);

            expect(attendanceService.modifyAttendanceRecord).toHaveBeenCalledWith('att123', req.body);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: "Attendance Updated Successfully",
                updatedAttendance: mockUpdated
            });
        });

        it('returns 404 if the record does not exist', async () => {
            attendanceService.modifyAttendanceRecord.mockRejectedValue(new Error('Attendance record not found'));
            await attendanceController.updateAttendance(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
        });
    });



    describe('deleteAttendance', () => {
        it('returns 200 and the deleted id on success', async () => {
            req.params.id = 'del123';
            attendanceService.removeAttendanceRecord.mockResolvedValue('del123');

            await attendanceController.deleteAttendance(req, res);

            expect(attendanceService.removeAttendanceRecord).toHaveBeenCalledWith('del123');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ id: 'del123', message: 'Attendance removed successfully' });
        });

        it('returns 404 if the record to delete is not found', async () => {
            attendanceService.removeAttendanceRecord.mockRejectedValue(new Error('Attendance not found'));
            await attendanceController.deleteAttendance(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
        });
    });
});