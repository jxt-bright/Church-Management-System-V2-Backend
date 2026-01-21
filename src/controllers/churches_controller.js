import { Church } from "../models/churches_model.js";
import mongoose from 'mongoose';



// Register a Church endpoint
const registerChurch = async (req, res) => {
    try {

        // Check if a church with the same name already exist
        const existing = await Church.findOne({ groupId: req.body.groupId, name: req.body.name });
        if (existing) {
            return res.status(400).json({ message: "A Church with same name in the Group already exists" })
        }

        // Create a new Church
        await Church.create({ ...req.body });

        // Send back response
        res.status(201).json({
            success: true,
            message: "Church successfully registered",
        });

    } catch (error) {
        res.status(500).json({ message: "Internal server error" })
    }
}


// Fetch all churches endpoint
const getChurches = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';

        let targetGroupId = null;

        // Forces groupId to be User's groupId
        if (req.user.status !== 'manager') {
            targetGroupId = req.user.groupId;
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
                return res.status(200).json({ churches: [], totalPages: 0, totalChurches: 0 });
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

        // Send response
        res.status(200).json({
            churches: data,
            totalPages: Math.ceil(totalDocs / limit),
            totalChurches: totalDocs
        });

    } catch (err) {
        res.status(500).json({ message: 'Error fetching churches' });
    }
};



// Fetch a paticular church endpoint
const getChurchById = async (req, res) => {
    try {
        const { id } = req.params;

        const church = await Church.findById(id);

        // Check if church exists
        if (!church) {
            return res.status(404).json({ message: 'Church not found' });
        }

        //  Send response (group data)
        res.status(200).json(church);

    } catch (error) {
        res.status(500).json({ message: 'Server Error fetching church details' });
    }
};


const updateChurch = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        await Church.findByIdAndUpdate(id, updates, {
            new: false, // Return the updated document
            runValidators: true // Enforce schema validation
        });

        res.status(200).json({
            message: 'Church updated successfully',
        });

    } catch (error) {
        // Handle duplicate name error (MongoDB code 11000)
        if (error.code === 11000) {
            return res.status(400).json({ message: 'A church with this name already exists' });
        }

        res.status(500).json({ message: 'Error updating church' });
    }
};



const deleteChurch = async (req, res) => {
    try {
        const church = await Church.findById(req.params.id);

        if (!church) {
            return res.status(404).json({ message: 'Church not found' });
        }

        await church.deleteOne();

        res.status(200).json({ id: req.params.id, message: 'Church removed successfully' });

    } catch (error) {
        res.status(500).json({ message: 'Error while deleting church' });
    }
};


export {
    registerChurch,
    getChurches,
    updateChurch,
    getChurchById,
    deleteChurch
}