import { Member } from "../models/members_model.js";
import { Church } from "../models/churches_model.js";
import cloudinary from '../config/cloudinary.js';

// 1. Create Member Logic
const createMember = async (data, user) => {
    const { profileImage, ...otherMemberData } = data;

    // Determine churchId(for churchPastor and churchUser) If frontend sent it use it (Manager, groupPastor and groupAdmin)
    let churchId = otherMemberData.churchId || user.churchId;

    if (!churchId) {
        throw new Error("Church is required");
    }

    // Fetch church to get groupId
    const church = await Church.findById(churchId).select("groupId");

    if (!church) {
        throw new Error("Church not found");
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

    return newMember;
};

// 2. Background Image Upload Logic (Fire & Forget)
const uploadMemberImage = async (memberId, imageString) => {
    // Image upload
    cloudinary.uploader
        .upload(imageString, {
            folder: "members",
            resource_type: "image",
            quality: "auto",
            fetch_format: "auto"
        })
        .then(async (upload) => {
            await Member.findByIdAndUpdate(memberId, {
                profileImage: {
                    url: upload.secure_url,
                    public_id: upload.public_id
                }
            });
        })
        .catch((err) => { });
};

// 3. Get Members Logic
const fetchAllMembers = async (query, user) => {
    // Pagination Setup
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 15;
    const skip = (page - 1) * limit;

    let dbQuery = {};

    // Search Logic
    const search = query.search || '';
    if (search) {
        dbQuery.$or = [
            { firstName: { $regex: '^' + search, $options: 'i' } },
            { lastName: { $regex: '^' + search, $options: 'i' } }
        ];
    }

    if (query.category) dbQuery.category = query.category;
    if (query.memberStatus) dbQuery.memberStatus = query.memberStatus;

    // Check user status (authorization)
    const userRole = user.status;

    if (['groupAdmin', 'groupPastor'].includes(userRole)) {
        // Must fetch only members in the user's group
        const churchesInGroup = await Church.find({ groupId: user.groupId }).distinct('_id');
        dbQuery.churchId = { $in: churchesInGroup };
    } else if (['churchAdmin', 'churchPastor'].includes(userRole)) {
        // Must only fetch members in the user's church
        dbQuery.churchId = user.churchId;
    }

    const [totalDocs, members] = await Promise.all([
        Member.countDocuments(dbQuery),
        Member.find(dbQuery)
            .select('firstName lastName phoneNumber memberStatus churchId') // Select specific fields
            .populate('churchId', 'name') // Populate church name
            .sort({ lastName: 1, firstName: 1 })
            .collation({ locale: "en", strength: 2 })
            .skip(skip)
            .limit(limit)
    ]);

    return {
        members,
        totalPages: Math.ceil(totalDocs / limit),
        currentPage: page,
        totalMembers: totalDocs
    };
};

// 4. Get Member By ID
const fetchMemberById = async (id) => {
    const member = await Member.findById(id);
    if (!member) {
        throw new Error('Member not found');
    }
    return member;
};

// 5. Update Member Details (No Image)
const modifyMemberDetails = async (id, updates) => {
    // Find member(needed for public_id) check
    // We do a check here to ensure existence before updating
    const member = await Member.findById(id);
    if (!member) {
        throw new Error("Member not found");
    }

    // Update all fields first except the image
    // so that the response can be sent instantly for the image update to be done later (Fire and Forget)
    const updatedMember = await Member.findByIdAndUpdate(
        id,
        { $set: updates },
        { new: true, runValidators: true }
    );

    return updatedMember;
};

// 6. Background Image Update Logic (Fire & Forget)
const handleImageUpdate = async (id, profileImage) => {
    // Need to fetch member again to get the current profileImage public_id for handling overwrites
    const member = await Member.findById(id).select('profileImage');
    if (!member) return;

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
};

// 7. Delete Member
const removeMember = async (id) => {
    const member = await Member.findById(id);

    if (!member) {
        throw new Error('Member not found');
    }

    await member.deleteOne();
    return id;
};

export {
    createMember,
    uploadMemberImage,
    fetchAllMembers,
    fetchMemberById,
    modifyMemberDetails,
    handleImageUpdate,
    removeMember
};