import { describe, it, expect, vi, beforeEach } from 'vitest';

import * as attendanceController from '../../controllers/attendance_controller.js';

import { Attendance } from "../../models/attendance_model.js"
import { Church } from "../../models/churches_model.js";
import mongoose from 'mongoose';

// Mock the Attendance and Church models
vi.mock("../../models/attendance_model.js");
vi.mock("../../models/churches_model.js");


describe('Attendance Controller', () => {
    let req;
    let res;

    beforeEach(() => {
        req = {
            body: {},
            params: {},
            query: {}
        };
        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        };
        vi.clearAllMocks();
    });


    // Test for the first endpoint (Save Attendance Records)
    describe('Save Attendance Endpoint', () => {

        it('should save attendance successfully', async () => {
            // Arrange
            req.body = { date: '2023-10-27', churchId: 'church_1', adultmale: 10 };

            // Act
            Attendance.findOne.mockResolvedValue(null);
            Church.findById.mockReturnValue({
                select: vi.fn().mockResolvedValue({ groupId: 'group_1' })
            });
            Attendance.create.mockResolvedValue({});
            await attendanceController.saveAttendance(req, res);

            // Assert
            expect(Attendance.findOne).toHaveBeenCalledWith({ date: '2023-10-27', churchId: 'church_1' });
            expect(Church.findById).toHaveBeenCalledWith('church_1');
            expect(Attendance.create).toHaveBeenCalledWith({ ...req.body, groupId: 'group_1' });
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                message: 'Attendance Record successfully saved'
            }));
        })

        it('should return 400 if attendance already exists for date/church', async () => {
            // Arrange
            req.body = { date: '2023-10-27', churchId: 'church_1' };
            Attendance.findOne.mockResolvedValue({ _id: 'Attendance_1' });

            // Act
            await attendanceController.saveAttendance(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Attendance with this date exist' });
            expect(Attendance.create).not.toHaveBeenCalled();
        });

        it('should return 500 on database error', async () => {
            // Arrange
            req.body = { date: '2023-10-27' };
            Attendance.findOne.mockRejectedValue(new Error('DB Error'));

            // Act
            await attendanceController.saveAttendance(req, res);

            // Assett
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Error saving attendance' });
        });
    })


    // Test for Fetch Attendance endpoint
    describe('Get Attendance Endpoint', () => {

        it('should fetch attendance records sorted by date', async () => {
            // Arrange
            req.query = { churchId: 'church_1', year: '2023', month: '10' };
            const mockRecords = [{ date: '2023-10-01' }, { date: '2023-10-08' }];

            // Mock Attendance.find().sort()
            const mockSort = vi.fn().mockResolvedValue(mockRecords);
            Attendance.find.mockReturnValue({ sort: mockSort });
            
            // Act
            await attendanceController.getAttendance(req, res);

            // Verify Date Calculation logic passed to find
            // Month 10 means Oct. In JS Date (0-indexed), start is Month 9.
            // Start: 2023, 9, 1. End: 2023, 10, 0 (Last day of Oct).
            const expectedStart = new Date(2023, 9, 1);
            expectedStart.setHours(0,0,0,0);

            // Assert
            expect(Attendance.find).toHaveBeenCalledWith({
                churchId: 'church_1',
                date: {
                    $gte: expect.any(Date),
                    $lte: expect.any(Date)
                }
            });
            expect(mockSort).toHaveBeenCalledWith({ date: 1 });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockRecords);
        });

        it('should return 400 if required parameters are missing', async () => {
            // Act
            req.query = { churchId: 'church_1' };

            await attendanceController.getAttendance(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Missing required parameters: churchId, year, or month." });
        });

        it('should return 500 on database error', async () => {
            // Act
            req.query = { churchId: 'church_1', year: '2023', month: '10' };
            Attendance.find.mockImplementation(() => { throw new Error('DB Fail'); });

            // Act
            await attendanceController.getAttendance(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(500);
        });
    });


    // Test for the update Attendance endpoint
    describe('Update Attendance Endpoint', () => {

        it('should clear number fields if Reason is provided (No Service)', async () => {
            // Arrange
            req.params.id = 'attendance_1';
            req.body = { reason: 'Joint Service' };

            // Mock successful update
            const mockUpdatedDoc = { _id: 'attendance_1', reason: 'Joint Service', adultmale: null };
            Attendance.findByIdAndUpdate.mockResolvedValue(mockUpdatedDoc);

            // Act
            await attendanceController.updateAttendance(req, res);

            const expectedPayload = expect.objectContaining({
                reason: 'Joint Service',
                adultmale: null,
                adultfemale: null,
                firstoffering: null
            });

            // Assert
            expect(Attendance.findByIdAndUpdate).toHaveBeenCalledWith(
                'attendance_1',
                expectedPayload,
                { new: true, runValidators: true }
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: "Attendance Updated Successfully", 
                updatedAttendance: mockUpdatedDoc
            });
        });

        it('should clear reason if Values are provided (Service Held)', async () => {
            // Arrange
            req.params.id = 'attendance_1';
            req.body = { adultmale: 50, adultfemale: 60 }; 

            const mockUpdatedDoc = { _id: 'attendance_1', reason: null, adultmale: 50 };
            Attendance.findByIdAndUpdate.mockResolvedValue(mockUpdatedDoc);

            // Act
            await attendanceController.updateAttendance(req, res);

            // Expect reason to be null, passed numbers to be present
            const expectedPayload = expect.objectContaining({
                reason: null,
                adultmale: 50,
                adultfemale: 60
            });

            // Assert
            expect(Attendance.findByIdAndUpdate).toHaveBeenCalledWith(
                'attendance_1',
                expectedPayload,
                { new: true, runValidators: true }
            );
        });

        it('should return 404 if record to update is not found', async () => {
            // Arrange
            req.params.id = 'attendance_2';
            req.body = { reason: 'Retreat' };
            Attendance.findByIdAndUpdate.mockResolvedValue(null);

            // Act
            await attendanceController.updateAttendance(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "Attendance record not found" });
        });
    });


    // Tests for delete Attendance endpoint
    describe('Delete Attendance Endpoint', () => {

        it('should delete attendance successfully', async () => {
            // Act
            req.params.id = 'attendance_2';
            
            // Mock finding the document which returns an object with a deleteOne function
            const mockDoc = { deleteOne: vi.fn().mockResolvedValue(true) };
            Attendance.findById.mockResolvedValue(mockDoc);

            // Assert
            await attendanceController.deleteAttendance(req, res);

            expect(Attendance.findById).toHaveBeenCalledWith('attendance_2');
            expect(mockDoc.deleteOne).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ id: 'attendance_2', message: 'Attendance removed successfully' });
        });

        it('should return 404 if attendance to delete is not found', async () => {
            // Arrange
            req.params.id = 'attendance_2';
            Attendance.findById.mockResolvedValue(null);

            // Act
            await attendanceController.deleteAttendance(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Attendance not found' });
        });

        it('should return 500 on database error during find', async () => {
            // Arrange
            req.params.id = 'attendance_2';
            Attendance.findById.mockRejectedValue(new Error('DB Error'));

            // Act
            await attendanceController.deleteAttendance(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Error while deleting attendance' });
        });
    });
})