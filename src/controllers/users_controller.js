import { User } from "../models/users_model.js";
import { Member } from "../models/members_model.js";
import mongoose from 'mongoose';



// Register user endpoint
const registerUser = async (req, res) => {
    try {
        if (req.user !== 'manager' && req.body.status == 'manager') {
            return res.status(400).json({ message: "Cannot Register a user with status of Manager." })
        }

        // Check if user already exist 
        const existing = await User.findOne({ username: req.body.username });
        if (existing) {
            return res.status(400).json({ message: "User already exists" })
        }

        const member = await Member.findById(req.body.memberId).select('churchId groupId')

        // Create a new user
        await User.create({ ...req.body, churchId: member.churchId, groupId: member.groupId });

        // Send back response
        res.status(201).json({
            success: true,
            message: "User successfully registered"
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" })
    }
};


const getUsers = async (req, res) => {
    try {
        // Pagination and Search Setup
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';

        // Check user status (authorization)
        const userRole = req.user.status;
        let matchStage = {};

        if (['groupAdmin', 'groupPastor'].includes(userRole)) {
            // Must fetch only users in the user's group
            matchStage.groupId = new mongoose.Types.ObjectId(req.user.groupId);
        } else if (userRole === 'churchPastor') {
            // Must only fetch users in the user's church
            matchStage.churchId = new mongoose.Types.ObjectId(req.user.churchId);
        }

        // Search logic
        if (search) {
            matchStage.$or = [
                { username: { $regex: '^' + search, $options: 'i' } }
            ];
        }

        // Aggregation Pipeline
        const result = await User.aggregate([

            { $match: matchStage },

            // Join Member details
            {
                $lookup: {
                    from: 'members',
                    localField: 'memberId',
                    foreignField: '_id',
                    as: 'memberData'
                }
            },
            { $unwind: { path: "$memberData", preserveNullAndEmptyArrays: true } },

            // Join Church details
            {
                $lookup: {
                    from: 'churches',
                    localField: 'churchId',
                    foreignField: '_id',
                    as: 'churchData'
                }
            },
            { $unwind: { path: "$churchData", preserveNullAndEmptyArrays: true } },

            // Project Response
            {
                $project: {
                    username: 1,
                    status: 1,
                    memberId: 1,
                    churchName: "$churchData.name",
                    groupId: 1,
                    churchId: 1
                }
            },

            // Pagination
            {
                $facet: {
                    metadata: [{ $count: "total" }],
                    data: [
                        { $sort: { username: 1 } },
                        { $skip: skip },
                        { $limit: limit }
                    ]
                }
            }
        ]);

        // Send Response
        const data = result[0].data;
        const totalDocs = result[0].metadata[0] ? result[0].metadata[0].total : 0;

        res.status(200).json({
            users: data,
            totalPages: Math.ceil(totalDocs / limit),
            totalUsers: totalDocs
        });

    } catch (err) {
        res.status(500).json({ message: 'Error fetching users', error: err.message });
    }
};


const getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id).populate('memberId', 'firstName lastName');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user details' });
    }
};


const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { username, status, memberId } = req.body;

        // Check if username already exist
        const existingUser = await User.findOne({ username });
        if (existingUser && existingUser._id.toString() !== id) {
            return res.status(400).json({ message: 'Username is already taken' });
        }

        // Update user
        const updatedUser = await User.findByIdAndUpdate(
            id,
            {
                username,
                status,
            },
            { new: true, runValidators: true }
        ).populate('memberId', 'firstName lastName');

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'User updated successfully', user: updatedUser });

    } catch (error) {
        res.status(500).json({ message: 'Server Error updating user' });
    }
};


const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent a user from deleting himself/herself
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: 'You cannot delete your own account' });
        }
        await user.deleteOne();

        res.status(200).json({ id: req.params.id, message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error while deleting user' });
    }
};



export {
    registerUser,
    getUsers,
    getUserById,
    updateUser,
    deleteUser
}


