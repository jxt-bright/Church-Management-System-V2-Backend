import { getDashboardStats } from '../services/dashboard.service.js'


const dashboardStats = async (req, res) => {
    try {
        const dashboardData = await getDashboardStats(req.query);
        
        res.status(200).json({
            success: true,
            data: dashboardData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve dashboard data'
        });
    }
};

export {
    dashboardStats
};