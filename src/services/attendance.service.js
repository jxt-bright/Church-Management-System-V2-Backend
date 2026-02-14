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

    let updateQuery = {};

    if (reason && reason.trim().length > 0) {
        // CASE A: Switching to (or updating) a REASON record
        updateQuery.$set = { reason: reason };
        updateQuery.$unset = {};
        numberFields.forEach(field => {
            updateQuery.$unset[field] = "";
        });
    } else {
        // CASE B: Switching to (or updating) DATA values
        // This will RE-INSERT the fields deleted by a previous $unset
        updateQuery.$set = { reason: null };

        numberFields.forEach(field => {
            // If the value exists in the body, set it. 
            // If it doesn't, we set it to 0 (or null) to ensure the field exists again.
            if (attendanceValues[field] !== undefined) {
                updateQuery.$set[field] = attendanceValues[field];
            } else {
                updateQuery.$set[field] = 0;
            }
        });
    }

    const updated = await Attendance.findByIdAndUpdate(
        id,
        updateQuery,
        { new: true, runValidators: true }
    );

    if (!updated) throw new Error("Attendance record not found");
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