import * as specialServiceService from '../services/specialService.service.js'



// Save Special Service Record
const saveSpecialService = async (req, res) => {
    try {
        await specialServiceService.saveSpecialService(req.body);
        return res.status(201).json({
            success: true,
            message: 'Special Service attendance recorded successfully'
        });
    } catch (error) {
        // Possible errors from the service
        const isClientError = error.name === 'BusinessError' || 
                             error.message.includes('Duplicate') || 
                             error.message.includes('not found');
        if (isClientError) {
            return res.status(400).json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};



// Fetch Special Services
const getSpecialService = async (req, res) => {
    try {
        const userStatus = req.user?.status?.toLowerCase();
        
        // Call the service
        const result = await specialServiceService.getSpecialService(req.query, userStatus);

        // Map data for frontend
        const formattedData = result.services.map(s => ({
            _id: s._id,
            category: s.category,
            date: s.date,
            adults: s.adults,
            youths: s.youths,
            children: s.children,
            total: s.total,
            churchName: s.churchId?.name || 'Unknown Church',
            churchLocation: s.churchId?.location || 'N/A'
        }));

        res.json({
            data: formattedData,
            totalPages: result.totalPages,
            totalRecords: result.totalRecords,
            currentPage: result.currentPage
        });

    } catch (error) {
        const statusCode = error.status || 500;
        res.status(statusCode).json({ 
            message: error.message || "Server error" 
        });
    }
};



// Update Special Service
const updateSpecialService = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Call the service function
        const updatedRecord = await specialServiceService.updateSpecialService(id, req.body);

        res.json({ 
            message: "Record updated successfully!", 
            data: updatedRecord 
        });
    } catch (error) {
        const statusCode = error.status || 500;
        res.status(statusCode).json({ 
            message: error.message || "Server error" 
        });
    }
};



// Delete Service Record Controller
const deleteAttendance = async (req, res) => {
    try {
        const { id } = req.params;

        // Call the service function
        await specialServiceService.deleteSpecialService(id);

        res.json({ 
            message: "Attendance record deleted successfully!" 
        });
    } catch (error) {
        // Pass the specific status code or default to 500
        const statusCode = error.status || 500;
        res.status(statusCode).json({ 
            message: error.message || "An error occurred while deleting the record." 
        });
    }
};


export {
    saveSpecialService,
    getSpecialService,
    updateSpecialService,
    deleteAttendance
}