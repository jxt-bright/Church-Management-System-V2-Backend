import * as memberService from '../services/members.service.js';

const registerMember_open = async (req, res) => {
    try {
        const { profileImage } = req.body;

        const newMember = await memberService.createMember(req.body, req.user);

        // Send response before uploading image if any
        // To improve the time it takes to return a response since u do not have to await the upload function
        res.status(201).json({
            success: true,
            message: "Member registered successfully",
            memberId: newMember._id
        });

        // Image upload
        if (profileImage) {
            // Background process - no await
            memberService.uploadMemberImage(newMember._id, profileImage);
        }

    } catch (error) {
        if (error.message === "Church is required") {
            return res.status(400).json({ success: false, message: error.message });
        }
        if (error.message === "Church not found") {
            return res.status(404).json({ success: false, message: error.message });
        }
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

export {
    registerMember_open
};