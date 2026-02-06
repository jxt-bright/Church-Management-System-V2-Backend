import { SpecialService } from "../models/specialService_model.js";
import { Church } from "../models/churches_model.js";



// Save Special Service Record
const saveSpecialService = async (data) => {
    const { date, churchId, category } = data;

    // Check for duplicates
    const existing = await SpecialService.findOne({ 
        churchId, 
        date: new Date(date), 
        category 
    });

    if (existing) {
        throw new Error(`Duplicate entry: ${category} has already been recorded for this date.`);
    }

    // Get Group ID
    const church = await Church.findById(churchId).select("groupId");
    if (!church) {
        throw new Error("Church not found");
    }

    // Create service record
    const newRecord = new SpecialService({
        ...data,
        groupId: church.groupId
    });

    return await newRecord.save();
};



// Fetch Special Service
const getSpecialService = async (queryData, userStatus) => {
    const { page = 1, limit = 6, month, category, churchId, groupId } = queryData;

    if (!category || !month) {
        throw { status: 400, message: "Invalid request: Category and Month are required." };
    }

    // Role-Based Validation Logic
    const isGroupRole = ['grouppastor', 'groupadmin'].includes(userStatus);

    // If not groupPastor/Admin or manager churchId must be provided
    if (!isGroupRole && userStatus !== 'manager' && !churchId) {
        throw { status: 400, message: "Invalid request: Church identifier is required" };
    }

    // If not manager churchId or groupId must be provided
    if (userStatus !== 'manager' && !churchId && !groupId) {
        throw { status: 400, message: "Invalid request: A Church or Group identifier is required" };
    }

    let query = { category };

    const start = new Date(`${month}-01`);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    query.date = { $gte: start, $lt: end };

    if (churchId) {
        query.churchId = churchId;
    } else if (groupId) {
        query.groupId = groupId;
    }

    const totalRecords = await SpecialService.countDocuments(query);
    const services = await SpecialService.find(query)
        .populate('churchId', 'name location')
        .sort({ date: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();

    return {
        services,
        totalPages: Math.ceil(totalRecords / limit),
        totalRecords,
        currentPage: Number(page)
    };
};



// Update a Record
const updateSpecialService = async (id, updateData) => {

    const currentRecord = await SpecialService.findById(id);
    
    if (!currentRecord) {
        throw { status: 404, message: "Service record not found." };
    }

    const churchId = updateData.churchId || currentRecord.churchId;
    const date = updateData.date || currentRecord.date;
    const category = updateData.category || currentRecord.category;

    const existingDuplicate = await SpecialService.findOne({
        _id: { $ne: id },
        churchId,
        date,
        category
    });

    if (existingDuplicate) {
        throw { 
            status: 400, 
            message: `A ${category} record already exists for this church on the selected date.` 
        };
    }

    const updatedRecord = await SpecialService.findByIdAndUpdate(
        id,
        updateData,
        { 
            new: true,
            runValidators: true 
        }
    );

    return updatedRecord;
};



// Delete Service Record
const deleteSpecialService = async (id) => {

    const deletedRecord = await SpecialService.findByIdAndDelete(id);

    if (!deletedRecord) {
        throw { status: 404, message: "Service record not found or already deleted." };
    }

    return deletedRecord;
};



export {
    saveSpecialService,
    getSpecialService,
    updateSpecialService,
    deleteSpecialService
}