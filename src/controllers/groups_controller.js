import { Group } from "../models/groups_model.js";
import { Church } from "../models/churches_model.js";
import { User } from "../models/users_model.js";


// Register a Group endpoint
const registerGroup = async (req, res) => {
    try {
        // Check if a group with the same name already exist
        const existing = await Group.findOne({ name: req.body.name });
        if (existing) {
            return res.status(400).json({ message: "A Group with same name already exists" })
        }

        // Create a new Group
        await Group.create(req.body);

        // Send back response
        res.status(201).json({
            success: true,
            message: "Group successfully registered.",
        });

    } catch (error) {
        res.status(500).json({ message: "Internal server error" })
    }
}



// Fetch all Groups 
const getGroups = async (req, res) => {
    try {
        // Pagination and Search
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';

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

        // Send Response
        res.status(200).json({
            groups: data,
            totalPages: Math.ceil(totalDocs / limit),
            totalGroups: totalDocs
        });

    } catch (err) {
        res.status(500).json({ message: 'Error fetching groups', error: err.message });
    }
};



const getGroupById = async (req, res) => {
    try {
        const { id } = req.params;

        // Find the group
        const group = await Group.findById(id);

        // Check if group exists
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        // Send response
        res.status(200).json(group);

    } catch (error) {
        res.status(500).json({ message: 'Server Error fetching group details' });
    }
};


const updateGroup = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Find and update the group
        await Group.findByIdAndUpdate(id, updates, {
            new: false,
            runValidators: true
        });

        res.status(200).json({
            message: 'Group updated successfully',
        });

    } catch (error) {
        // Handle duplicate key error
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Group name already exists' });
        }

        res.status(500).json({ message: 'Error updating group' });
    }
};


const deleteGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    await group.deleteOne();

    res.status(200).json({ id: req.params.id, message: 'Group removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error while deleting group' });
  }
};


export {
    registerGroup,
    getGroups,
    getGroupById,
    updateGroup,
    deleteGroup
}