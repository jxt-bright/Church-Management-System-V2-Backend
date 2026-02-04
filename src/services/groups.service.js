import { Group } from "../models/groups_model.js";

const createGroup = async (data) => {
    // Check if a group with the same name already exist
    const existing = await Group.findOne({ name: data.name });
    if (existing) {
        throw new Error("A Group with same name already exists");
    }

    // Create a new Group
    await Group.create(data);
};

const fetchAllGroups = async (query) => {
    // Pagination and Search
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = query.search || '';

    // Match Stage (Search Logic)
    let matchStage = {};
    if (search) {
        matchStage.$or = [
            { name: { $regex: '^' + search, $options: 'i' } }
        ];
    }

    // Aggregation Pipeline
    const result = await Group.aggregate([
        // Filter first (reduce the dataset immediately)
        { $match: matchStage },

        // Join with Churches Collection
        {
            $lookup: {
                from: 'churches',
                localField: '_id',
                foreignField: 'groupId',
                as: 'churchesData'
            }
        },

        // Join with Members Collection
        {
            $lookup: {
                from: 'members',
                localField: '_id',
                foreignField: 'groupId',
                as: 'membersData'
            }
        },

        // Add Count fields and remove heavy arrays
        {
            $project: {
                name: 1,
                location: 1,
                pastor: 1,
                phoneNumber: 1,
                email: 1,
                churches: { $size: "$churchesData" },
                members: { $size: "$membersData" }
            }
        },

        // Handle Pagination using $facet (Gets data and total count in one go)
        {
            $facet: {
                metadata: [{ $count: "total" }], // Counts total matches
                data: [
                    { $sort: { name: 1 } },      // Sort alphabetically
                    { $skip: skip },             // Skip for pagination
                    { $limit: limit }            // Limit for pagination
                ]
            }
        }
    ]);

    // Extract Data from Facet Result
    // The result comes back as an array with one object containing metadata and data
    const data = result[0].data;
    const totalDocs = result[0].metadata[0] ? result[0].metadata[0].total : 0;

    return {
        groups: data,
        totalPages: Math.ceil(totalDocs / limit),
        totalGroups: totalDocs
    };
};

const fetchGroupById = async (id) => {
    // Find the group
    const group = await Group.findById(id);

    // Check if group exists
    if (!group) {
        throw new Error("Group not found");
    }
    return group;
};

const modifyGroup = async (id, updates) => {
    try {
        // Find and update the group
        await Group.findByIdAndUpdate(id, updates, {
            new: false,
            runValidators: true
        });
    } catch (error) {
        // Handle duplicate key error
        if (error.code === 11000) {
            throw new Error("Group name already exists");
        }
        throw error;
    }
};

const removeGroup = async (id) => {
    const group = await Group.findById(id);

    if (!group) {
        throw new Error("Group not found");
    }

    await group.deleteOne();
    return id;
};

export {
    createGroup,
    fetchAllGroups,
    fetchGroupById,
    modifyGroup,
    removeGroup
};