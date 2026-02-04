import { Church } from "../models/churches_model.js";
import { Attendance } from "../models/attendance_model.js";
import { getMonthDateRange } from "../utils/date.utils.js"; 



// SAVE Logic
const createAttendanceRecord = async (data) => {
    const { date, churchId } = data;

    // Check for duplicates
    const existing = await Attendance.findOne({ date, churchId });
    if (existing) {
        throw new Error("Attendance with this date exists");
    }

    // Get Group ID
    const church = await Church.findById(churchId).select("groupId");
    if (!church) {
        throw new Error("Church not found");
    }

    // Create
    return await Attendance.create({ ...data, groupId: church.groupId });
};



// GET Logic
const fetchMonthlyAttendance = async (churchId, year, month) => {
    // Delegate date math to the utility function
    const { startDate, endDate } = getMonthDateRange(year, month);

    return await Attendance.find({
        churchId,
        date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });
};



// UPDATE Logic
const modifyAttendanceRecord = async (id, body) => {
    const { reason, ...attendanceValues } = body;
    
    const numberFields = [
        'adultmale', 'adultfemale', 'youthmale', 'youthfemale',
        'childrenmale', 'childrenfemale', 'newcomersmales', 'newcomersfemales',
        'firstoffering', 'secondoffering'
    ];

    let updatePayload = {};


    if (reason && reason.trim().length > 0) {
        updatePayload.reason = reason;
        numberFields.forEach(field => updatePayload[field] = null);
    } else {
        updatePayload.reason = null;
        numberFields.forEach(field => {
            if (attendanceValues[field] !== undefined) {
                updatePayload[field] = attendanceValues[field];
            } else {
                updatePayload[field] = null; // Enforce null if missing
            }
        });
    }

    const updated = await Attendance.findByIdAndUpdate(id, updatePayload, { 
        new: true, 
        runValidators: true 
    });

    if (!updated) {
        throw new Error("Attendance record not found");
    }

    return updated;
};



// DELETE Logic
const removeAttendanceRecord = async (id) => {
    const attendance = await Attendance.findById(id);
    if (!attendance) {
        throw new Error("Attendance not found");
    }
    await attendance.deleteOne();
    return id;
};



export {
    createAttendanceRecord,
    fetchMonthlyAttendance,
    modifyAttendanceRecord,
    removeAttendanceRecord
};