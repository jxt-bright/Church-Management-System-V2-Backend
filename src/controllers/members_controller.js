import { Member } from "../models/members_model.js";
import cloudinary from '../config/cloudinary.js';
import { Church } from "../models/churches_model.js";



const registerMember = async (req, res) => {
    try {
        const { profileImage, ...otherMemberData } = req.body;

        // Determine churchId(for churchPastor and churchUser) If frontend sent it use it (Manager, groupPastor and groupAdmin)
        let churchId = otherMemberData.churchId || req.user.churchId;

        if (!churchId) {
            return res.status(400).json({
                success: false,
                message: "Church is required"
            });
        }


        // Fetch church to get groupId
        const church = await Church.findById(churchId).select("groupId");

        if (!church) {
            return res.status(404).json({
                success: false,
                message: "Church not found"
            });
        }

        const newMember = await Member.create({
            ...otherMemberData,
            churchId,
            groupId: church.groupId,
            profileImage: {
                url: null,
                public_id: null
            }
        });

        // Send response before uploading image if any
        // To improve the time it takes to return a response since u do not have to await the upload function
        res.status(201).json({
            success: true,
            message: "Member registered successfully",
            memberId: newMember._id
        });

        // Image upload
        if (profileImage) {
            cloudinary.uploader
                .upload(profileImage, {
                    folder: "members",
                    resource_type: "image",
                    quality: "auto",
                    fetch_format: "auto"
                })
                .then(async (upload) => {
                    await Member.findByIdAndUpdate(newMember._id, {
                        profileImage: {
                            url: upload.secure_url,
                            public_id: upload.public_id
                        }
                    });
                })
                .catch((err) => { });
        }

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


const getMembers = async (req, res) => {
    try {
        // Pagination Setup
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 15;
        const skip = (page - 1) * limit;

        let query = {};

        // Search Logic
        const search = req.query.search || '';
        if (search) {
            query.$or = [
                { firstName: { $regex: '^' + search, $options: 'i' } },
                { lastName: { $regex: '^' + search, $options: 'i' } }
            ];
        }

        if (req.query.category) query.category = req.query.category;
        if (req.query.memberStatus) query.memberStatus = req.query.memberStatus;

        // Check user status (authorization)
        const userRole = req.user.status;

        if (['groupAdmin', 'groupPastor'].includes(userRole)) {
            // Must fetch only members in the user's group
            const churchesInGroup = await Church.find({ groupId: req.user.groupId }).distinct('_id');
            query.churchId = { $in: churchesInGroup };
        } else if (['churchAdmin', 'churchPastor'].includes(userRole)) {
            // Must only fetch members in the user's church
            query.churchId = req.user.churchId;
        }

        const [totalDocs, members] = await Promise.all([
            Member.countDocuments(query),
            Member.find(query)
                .select('firstName lastName phoneNumber memberStatus churchId') // Select specific fields
                .populate('churchId', 'name') // Populate church name
                .sort({ lastName: 1, firstName: 1 })
                .collation({ locale: "en", strength: 2 })
                .skip(skip)
                .limit(limit)
        ]);

        // Send Response
        res.status(200).json({
            members,
            totalPages: Math.ceil(totalDocs / limit),
            currentPage: page,
            totalMembers: totalDocs
        });

    } catch (err) {
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};


const getMemberById = async (req, res) => {
    try {
        const { id } = req.params;

        const member = await Member.findById(id);

        if (!member) {
            return res.status(404).json({ message: 'Member not found' });
        }

        res.status(200).json(member);

    } catch (error) {
        // Check if error is due to invalid Object ID format
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Member not found' });
        }

        res.status(500).json({ message: 'Server Error' });
    }
};


const updateMember = async (req, res) => {
    try {
        const { id } = req.params;

        let { profileImage, ...updates } = req.body;

        // Find member(needed for public_id)
        const member = await Member.findById(id).select('profileImage');

        if (!member) {
            return res.status(404).json({ message: "Member not found" });
        }

        // Update all fields first except the image
        // so that the response can be sent instantly for the image update to be done later (Fire and Forget)
        const updatedMember = await Member.findByIdAndUpdate(
            id,
            { $set: updates },
            { new: true, runValidators: true }
        );

        // Send reponse
        res.status(200).json({
            success: true,
            message: "Member updated successfully",
            member: updatedMember
        });

        // Image update
        if (profileImage && typeof profileImage === 'string') {
            const uploadOptions = {
                folder: 'images',
                resource_type: 'auto',
                overwrite: true,
                invalidate: true
            };

            // Reuse existing public_id if available to overwrite
            if (member.profileImage && member.profileImage.public_id) {
                uploadOptions.public_id = member.profileImage.public_id;
            }

            // Start Upload Promise
            cloudinary.uploader.upload(profileImage, uploadOptions)
                .then(async (uploadResponse) => {
                    // update database with the new image URL
                    await Member.findByIdAndUpdate(id, {
                        profileImage: {
                            url: uploadResponse.secure_url,
                            public_id: uploadResponse.public_id
                        }
                    });

                    // Clear memory
                    profileImage = null;
                })
                .catch((err) => { });

        } else if (profileImage === null) {
            if (member.profileImage && member.profileImage.public_id) {
                cloudinary.uploader.destroy(member.profileImage.public_id)
                    .catch();
            }
            // Re-update to set image to null
            await Member.findByIdAndUpdate(id, { profileImage: { url: null, public_id: null } });
        }

    } catch (error) {
        // Only send error if we haven't sent response yet
        if (!res.headersSent) {
            res.status(500).json({ message: "Internal server error" });
        }
    }
};


const deleteMember = async (req, res) => {
    try {
        const member = await Member.findById(req.params.id);

        if (!member) {
            return res.status(404).json({ message: 'Member not found' });
        }

        await member.deleteOne();

        res.status(200).json({ id: req.params.id, message: 'Member removed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error while deleting member' });
    }
};


export {
    registerMember,
    getMembers,
    getMemberById,
    updateMember,
    deleteMember
}