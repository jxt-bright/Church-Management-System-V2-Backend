import * as churchService from '../services/churches.service.js';


// Fetch all churches endpoint
const getChurches_open = async (req, res) => {
    try {
        const result = await churchService.fetchAllChurches_open(req.query, req.user);

        // Send response
        res.status(200).json(result);

    } catch (err) {
        res.status(500).json({ message: 'Error fetching churches' });
    }
};


export {
    getChurches_open,
}