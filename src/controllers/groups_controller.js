import * as groupService from '../services/groups.service.js';

// Register a Group endpoint
const registerGroup = async (req, res) => {
    try {
        await groupService.createGroup(req.body);

        // Send back response
        res.status(201).json({
            success: true,
            message: "Group successfully registered.",
        });

    } catch (error) {
        if (error.message === "A Group with same name already exists") {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: "Internal server error" });
    }
}


// Fetch all Groups 
const getGroups = async (req, res) => {
    try {
        const result = await groupService.fetchAllGroups(req.query);

        // Send Response
        res.status(200).json(result);

    } catch (err) {
        res.status(500).json({ message: 'Error fetching groups', error: err.message });
    }
};


const getGroupById = async (req, res) => {
    try {
        const group = await groupService.fetchGroupById(req.params.id);

        // Send response
        res.status(200).json(group);

    } catch (error) {
        if (error.message === "Group not found") {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: 'Server Error fetching group details' });
    }
};


const updateGroup = async (req, res) => {
    try {
        await groupService.modifyGroup(req.params.id, req.body);

        res.status(200).json({
            message: 'Group updated successfully',
        });

    } catch (error) {
        if (error.message === "Group name already exists") {
            return res.status(400).json({ message: error.message });
        }

        res.status(500).json({ message: 'Error updating group' });
    }
};


const deleteGroup = async (req, res) => {
    try {
        const id = await groupService.removeGroup(req.params.id);

        res.status(200).json({ id, message: 'Group removed successfully' });
    } catch (error) {
        if (error.message === "Group not found") {
            return res.status(404).json({ message: error.message });
        }
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