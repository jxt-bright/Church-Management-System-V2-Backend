import * as memberService from '../services/members.service.js';

const registerMember = async (req, res) => {
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


const getMembers = async (req, res) => {
    try {
        const result = await memberService.fetchAllMembers(req.query, req.user);

        // Send Response
        res.status(200).json(result);

    } catch (err) {
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};


const getMemberById = async (req, res) => {
    try {
        const member = await memberService.fetchMemberById(req.params.id);

        res.status(200).json(member);

    } catch (error) {
        // Check if error is due to invalid Object ID format
        if (error.kind === 'ObjectId' || error.message === 'Member not found') {
            return res.status(404).json({ message: 'Member not found' });
        }

        res.status(500).json({ message: 'Server Error' });
    }
};


const updateMember = async (req, res) => {
    try {
        const { id } = req.params;
        const { profileImage, ...updates } = req.body;

        const updatedMember = await memberService.modifyMemberDetails(id, updates);

        // Send reponse
        res.status(200).json({
            success: true,
            message: "Member updated successfully",
            member: updatedMember
        });

        // Image update
        if (profileImage !== undefined) {
             // Background process - no await
            memberService.handleImageUpdate(id, profileImage);
        }

    } catch (error) {
        if (error.message === "Member not found") {
            return res.status(404).json({ message: "Member not found" });
        }
        
        // Only send error if we haven't sent response yet
        if (!res.headersSent) {
            res.status(500).json({ message: "Internal server error" });
        }
    }
};


const deleteMember = async (req, res) => {
    try {
        await memberService.removeMember(req.params.id);

        res.status(200).json({ id: req.params.id, message: 'Member removed successfully' });
    } catch (error) {
        if (error.message === 'Member not found') {
            return res.status(404).json({ message: 'Member not found' });
        }
        res.status(500).json({ message: 'Server error while deleting member' });
    }
};


export {
    registerMember,
    getMembers,
    getMemberById,
    updateMember,
    deleteMember
};