import { User } from "../models/users_model.js";
import { Member } from "../models/members_model.js";
import mongoose from 'mongoose';

const createUser = async (data, currentUserRole) => {
    if (currentUserRole !== 'manager' && data.status == 'manager') {
        throw new Error("Cannot Register a user with status of Manager.");
    }

    // Check if user already exist 
    const existing = await User.findOne({ username: data.username });
    if (existing) {
        throw new Error("User already exists");
    }

    const member = await Member.findById(data.memberId).select('churchId groupId');

    // Create a new user
    await User.create({ ...data, churchId: member.churchId, groupId: member.groupId });
};

const fetchUsers = async (query, currentUser) => {
    // Pagination and Search Setup
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = query.search || '';

    // Check user status (authorization)
    const userRole = currentUser.status;
    let matchStage = {};

    if (['groupAdmin', 'groupPastor'].includes(userRole)) {
        // Must fetch only users in the user's group
        matchStage.groupId = new mongoose.Types.ObjectId(currentUser.groupId);
    } else if (userRole === 'churchPastor') {
        // Must only fetch users in the user's church
        matchStage.churchId = new mongoose.Types.ObjectId(currentUser.churchId);
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

    return {
        users: data,
        totalPages: Math.ceil(totalDocs / limit),
        totalUsers: totalDocs
    };
};

const fetchUserById = async (id) => {
    const user = await User.findById(id).populate('memberId', 'firstName lastName');

    if (!user) {
        throw new Error("User not found");
    }
    return user;
};

const modifyUser = async (id, data) => {
    const { username, status } = data;

    // Check if username already exist
    const existingUser = await User.findOne({ username });
    if (existingUser && existingUser._id.toString() !== id) {
        throw new Error("Username is already taken");
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
        throw new Error("User not found");
    }

    return updatedUser;
};

const removeUser = async (id, currentUserId) => {
    const user = await User.findById(id);

    if (!user) {
        throw new Error("User not found");
    }

    // Prevent a user from deleting himself/herself
    if (user._id.toString() === currentUserId.toString()) {
        throw new Error("You cannot delete your own account");
    }
    await user.deleteOne();

    return id;
};

export {
    createUser,
    fetchUsers,
    fetchUserById,
    modifyUser,
    removeUser
};