import * as attendanceService from '../services/attendance.service.js';

// Save Attendance
const saveAttendance = async (req, res) => {
    try {
        await attendanceService.createAttendanceRecord(req.body);
        res.status(201).json({
            success: true,
            message: 'Attendance Record successfully saved'
        });
    } catch (error) {
        if (error.message === 'Attendance with this date exists') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error saving attendance' });
    }
};



// Fetch Attendance
const getAttendance = async (req, res) => {
    try {
        const { churchId, year, month } = req.query;

        if (!churchId || !year || !month) {
            return res.status(400).json({ message: "Missing required parameters: churchId, year, or month." });
        }

        const records = await attendanceService.fetchMonthlyAttendance(churchId, year, month);
        res.status(200).json(records);
    } catch (error) {
        res.status(500).json({ message: "Server error while fetching attendance data." });
    }
};



// Update Attendance
const updateAttendance = async (req, res) => {
    try {
        const updatedAttendance = await attendanceService.modifyAttendanceRecord(req.params.id, req.body);
        res.status(200).json({ 
            message: "Attendance Updated Successfully", 
            updatedAttendance 
        });
    } catch (error) {
        if (error.message === "Attendance record not found") {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: error.message || "Server Error" });
    }
};



// Delete Attendance
const deleteAttendance = async (req, res) => {
    try {
        const id = await attendanceService.removeAttendanceRecord(req.params.id);
        res.status(200).json({ id, message: 'Attendance removed successfully' });
    } catch (error) {
        if (error.message === 'Attendance not found') {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error while deleting attendance' });
    }
};



export {
    saveAttendance,
    getAttendance,
    updateAttendance,
    deleteAttendance
};