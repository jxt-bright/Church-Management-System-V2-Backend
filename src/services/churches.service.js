import { Church } from "../models/churches_model.js";
import mongoose from 'mongoose';

const createChurch = async (data) => {
    // Check if a church with the same name already exist
    const existing = await Church.findOne({ groupId: data.groupId, name: data.name });
    if (existing) {
        throw new Error("A Church with same name in the Group already exists");
    }

    // Create a new Church
    await Church.create({ ...data });
};

const fetchAllChurches = async (query, user) => {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = query.search || '';

    let targetGroupId = null;

    // Forces groupId to be User's groupId
    if (user.status !== 'manager') {
        targetGroupId = user.groupId;
    }

    let matchStage = {};

    if (search) {
        matchStage.$or = [
            { name: { $regex: '^' + search, $options: 'i' } }
        ];
    }

    // Check if 'targetGroupId' is genuine
    if (targetGroupId) {
        if (mongoose.Types.ObjectId.isValid(targetGroupId)) {
            matchStage.groupId = new mongoose.Types.ObjectId(targetGroupId);
        } else {
            // Return empty structure immediately if ID is invalid
            return { churches: [], totalPages: 0, totalChurches: 0 };
        }
    }

    const result = await Church.aggregate([
        { $match: matchStage },

        {
            $lookup: {
                from: 'groups',
                localField: 'groupId',
                foreignField: '_id',
                as: 'groupData'
            }
        },
        {
            $lookup: {
                from: 'members',
                localField: '_id',
                foreignField: 'churchId',
                as: 'membersData'
            }
        },
        {
            $project: {
                name: 1,
                location: 1,
                pastor: 1,
                phoneNumber: 1,
                email: 1,
                groupName: { $arrayElemAt: ["$groupData.name", 0] },
                members: { $size: "$membersData" }
            }
        },
        {
            $facet: {
                metadata: [{ $count: "total" }],
                data: [
                    { $sort: { name: 1 } },
                    { $skip: skip },
                    { $limit: limit }
                ]
            }
        }
    ]);

    // Extract Data from Facet Result
    // The result comes back as an array with one object containing metadata and data
    const data = result[0].data;
    const totalDocs = result[0].metadata[0] ? result[0].metadata[0].total : 0;

    return {
        churches: data,
        totalPages: Math.ceil(totalDocs / limit),
        totalChurches: totalDocs
    };
};

const fetchChurchById = async (id) => {
    const church = await Church.findById(id);

    // Check if church exists
    if (!church) {
        throw new Error("Church not found");
    }
    return church;
};

const modifyChurch = async (id, updates) => {
    try {
        await Church.findByIdAndUpdate(id, updates, {
            new: false, // Return the updated document
            runValidators: true // Enforce schema validation
        });
    } catch (error) {
        // Handle duplicate name error (MongoDB code 11000)
        if (error.code === 11000) {
            throw new Error("A church with this name already exists");
        }
        throw error;
    }
};

const removeChurch = async (id) => {
    const church = await Church.findById(id);

    if (!church) {
        throw new Error("Church not found");
    }

    await church.deleteOne();
    return id;
};

export {
    createChurch,
    fetchAllChurches,
    fetchChurchById,
    modifyChurch,
    removeChurch
};