import * as churchService from '../services/churches.service.js';

// Register a Church endpoint
const registerChurch = async (req, res) => {
    try {
        await churchService.createChurch(req.body);

        // Send back response
        res.status(201).json({
            success: true,
            message: "Church successfully registered",
        });

    } catch (error) {
        if (error.message === "A Church with same name in the Group already exists") {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: "Internal server error" });
    }
};


// Fetch all churches endpoint
const getChurches = async (req, res) => {
    try {
        const result = await churchService.fetchAllChurches(req.query, req.user);

        // Send response
        res.status(200).json(result);

    } catch (err) {
        res.status(500).json({ message: 'Error fetching churches' });
    }
};


// Fetch a paticular church endpoint
const getChurchById = async (req, res) => {
    try {
        const church = await churchService.fetchChurchById(req.params.id);

        //  Send response (group data)
        res.status(200).json(church);

    } catch (error) {
        if (error.message === "Church not found") {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: 'Server Error fetching church details' });
    }
};


const updateChurch = async (req, res) => {
    try {
        await churchService.modifyChurch(req.params.id, req.body);

        res.status(200).json({
            message: 'Church updated successfully',
        });

    } catch (error) {
        if (error.message === "A church with this name already exists") {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error updating church' });
    }
};


const deleteChurch = async (req, res) => {
    try {
        const id = await churchService.removeChurch(req.params.id);

        res.status(200).json({ id, message: 'Church removed successfully' });

    } catch (error) {
        if (error.message === "Church not found") {
            return res.status(404).json({ message: error.message });
        }
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