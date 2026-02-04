import { Church } from "../models/churches_model.js";
import { Attendance } from "../models/attendance_model.js"

// Save Attendance Route
const saveAttendance = async (req, res) => {
    try {
        const attendance = await Attendance.findOne({ date: req.body.date, churchId: req.body.churchId })
        if (attendance) {
            return res.status(400).json({
                message: 'Attendance with this date exist'
            })
        }
        const church = await Church.findById(req.body.churchId).select("groupId");

        await Attendance.create({ ...req.body, groupId: church.groupId });

        res.status(201).json({
            success: true,
            message: 'Attendance Record successfully saved'
        })
    } catch (error) {
        res.status(500).json({
            message: 'Error saving attendance'
        })
    }
}



// Fetch attendance
const getAttendance = async (req, res) => {
    try {
        const { churchId, year, month } = req.query;

        // 1. Validation
        if (!churchId || !year || !month) {
            return res.status(400).json({ message: "Missing required parameters: churchId, year, or month." });
        }

        // 2. Date Calculation
        // Frontend sends month as 1-12. JavaScript Date expects 0-11.
        const yearInt = parseInt(year);
        const monthInt = parseInt(month);

        // Start Date: 1st day of the month at 00:00:00
        const startDate = new Date(yearInt, monthInt - 1, 1);
        startDate.setHours(0, 0, 0, 0);

        // End Date: Last day of the month at 23:59:59
        // (Providing '0' as the day for the *next* month gives the last day of *this* month)
        const endDate = new Date(yearInt, monthInt, 0);
        endDate.setHours(23, 59, 59, 999);

        // 3. Database Query
        const records = await Attendance.find({
            churchId: churchId,
            date: {
                $gte: startDate, // Greater than or equal to start of month
                $lte: endDate    // Less than or equal to end of month
            }
        }).sort({ date: 1 }); // Optional: Return sorted by date (1st -> 31st)

        // 4. Response
        res.status(200).json(records);

    } catch (error) {
        // console.error("Error fetching attendance:", error);
        res.status(500).json({ message: "Server error while fetching attendance data." });
    }
}



// Edit attendance endpoint

const updateAttendance = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason, ...attendanceValues } = req.body;

        // 1. Define all your numerical fields to ensure we can reset them
        const numberFields = [
            'adultmale', 'adultfemale', 'youthmale', 'youthfemale',
            'childrenmale', 'childrenfemale', 'newcomersmales', 'newcomersfemales',
            'firstoffering', 'secondoffering'
        ];

        let updatePayload = {};

        // 2. LOGIC: Check if a reason is provided (Meaning "No Service")
        if (reason && reason.trim().length > 0) {
            updatePayload.reason = reason;

            // Force all number fields to null
            numberFields.forEach(field => {
                updatePayload[field] = null;
            });

        } else {
            updatePayload.reason = null;

            // Spread the attendance values from the request
            numberFields.forEach(field => {
                if (attendanceValues[field] !== undefined) {
                    updatePayload[field] = attendanceValues[field];
                } else {
                    // Optional: If value missing in body, set to null or keep existing?
                    // Based on your prompt, we usually want to set specific values.
                    // If your frontend sends the whole object, the line above works.
                }
            });

            updatePayload = { ...updatePayload, ...attendanceValues };
        }

        // 3. Perform the Update
        const updatedAttendance = await Attendance.findByIdAndUpdate(
            id,
            updatePayload,
            {
                new: true, // Return the UPDATED document (not the old one)
                runValidators: true // Ensure schema rules (min: 0, etc.) are checked
            }
        );

        if (!updatedAttendance) {
            return res.status(404).json({ message: "Attendance record not found" });
        }

        res.status(200).json({ message: "Attendance Updated Successfully", updatedAttendance });

    } catch (error) {
        // console.log(error);
        res.status(500).json({ message: error.message || "Server Error" });
    }
};



// Delete attendance endpoint
const deleteAttendance = async (req, res) => {
    try {
        const attendance = await Attendance.findById(req.params.id);

        if (!attendance) {
            return res.status(404).json({ message: 'Attendance not found' });
        }

        await attendance.deleteOne();

        res.status(200).json({ id: req.params.id, message: 'Attendance removed successfully' });

    } catch (error) {
        res.status(500).json({ message: 'Error while deleting attendance' });
    }
}


export {
    saveAttendance,
    getAttendance,
    updateAttendance,
    deleteAttendance
}